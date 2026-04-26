from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from app.models.chat import OfferCreate, OfferUpdate
from app.services.chat_service import (
    get_or_create_chat_room, get_room_messages, send_offer,
    update_offer_status, confirm_agreement, cancel_request,
    save_message, mark_messages_as_read
)
from app.dependencies import get_current_user
from app.database import get_db
from app.websockets.manager import manager, get_user_from_token
from app.services.chat_service import _serialize_msg
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/api/chat", tags=["Chat"])


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _map_error(result: str):
    if result == "not_found":
        raise HTTPException(status_code=404, detail="Chat room or request not found")
    if result == "forbidden":
        raise HTTPException(status_code=403, detail="You are not authorized to access this chat")
    if result == "invalid_status":
        raise HTTPException(status_code=400, detail="Invalid action for current status")


# ─── HTTP Routes ──────────────────────────────────────────────────────────────

@router.get("/{request_id}")
async def get_chat_room(request_id: str, current_user: dict = Depends(get_current_user)):
    """Get or create chat room for a request."""
    if current_user.get("role") == "moderator":
        raise HTTPException(status_code=403, detail="Moderators cannot access chat rooms")
    result = await get_or_create_chat_room(request_id, current_user["_id"])
    if isinstance(result, str):
        _map_error(result)
    return result


@router.get("/{request_id}/messages")
async def get_messages(
    request_id: str,
    page: int = 1,
    per_page: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get paginated messages for a chat room."""
    result = await get_room_messages(request_id, current_user["_id"], page, per_page)
    if isinstance(result, str):
        _map_error(result)
    return result


@router.post("/{request_id}/offer")
async def create_offer(
    request_id: str,
    data: OfferCreate,
    current_user: dict = Depends(get_current_user)
):
    """Provider sends a price offer."""
    if current_user["role"] != "provider":
        raise HTTPException(status_code=403, detail="Only providers can send offers")

    result = await send_offer(request_id, current_user["_id"], data.amount, data.note)
    if isinstance(result, str):
        _map_error(result)
    await manager.broadcast(request_id, {"type": "offer", "message": result})
    return result


@router.patch("/{request_id}/offer/{message_id}")
async def update_offer(
    request_id: str,
    message_id: str,
    data: OfferUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Client updates offer status."""
    if current_user["role"] != "client":
        raise HTTPException(status_code=403, detail="Only clients can update offers")

    if data.status not in ["accepted", "negotiating"]:
        raise HTTPException(status_code=400, detail="Status must be 'accepted' or 'negotiating'")

    result = await update_offer_status(request_id, message_id, current_user["_id"], data.status)
    if isinstance(result, str):
        _map_error(result)
    await manager.broadcast(request_id, {"type": "offer_update", "message": result})
    return result


@router.patch("/{request_id}/confirm")
async def confirm(request_id: str, current_user: dict = Depends(get_current_user)):
    """User confirms the agreement."""
    result = await confirm_agreement(request_id, current_user["_id"])
    if isinstance(result, str):
        _map_error(result)
    if result.get("status") == "both_confirmed":
        await manager.broadcast(request_id, {"type": "confirmed"})
    return result


@router.patch("/{request_id}/cancel")
async def cancel(request_id: str, current_user: dict = Depends(get_current_user)):
    """Either party cancels the request."""
    result = await cancel_request(request_id, current_user["_id"])
    if isinstance(result, str):
        _map_error(result)
    cancelled_by = result.get("cancelled_by", "User")
    await manager.broadcast(request_id, {
        "type": "cancelled",
        "message": f"Request was cancelled by {cancelled_by}"
    })
    return result


# ─── WebSocket Endpoint ───────────────────────────────────────────────────────

@router.websocket("/ws/{request_id}")
async def websocket_endpoint(websocket: WebSocket, request_id: str, token: str = None):
    """WebSocket endpoint for real-time chat."""
    if not token:
        await websocket.close(code=4001, reason="Token required")
        return

    user = await get_user_from_token(token)
    if not user:
        await websocket.close(code=4001, reason="Invalid token")
        return

    db = get_db()
    request = await db.service_requests.find_one({"_id": ObjectId(request_id)})
    if not request:
        await websocket.close(code=4001, reason="Request not found")
        return

    if str(request["client_id"]) != user["_id"] and str(request["provider_id"]) != user["_id"]:
        await websocket.close(code=4001, reason="Not authorized")
        return

    if manager.get_connection_count(request_id) >= 10:
        await websocket.close(code=4001, reason="Room is full")
        return

    # Get or create room
    room = await db.chat_rooms.find_one({"request_id": ObjectId(request_id)})
    if not room:
        room_doc = {
            "request_id": ObjectId(request_id),
            "client_id": request["client_id"],
            "provider_id": request["provider_id"],
            "status": "negotiating",
            "agreed_price": None,
            "client_confirmed": False,
            "provider_confirmed": False,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        result = await db.chat_rooms.insert_one(room_doc)
        room = await db.chat_rooms.find_one({"_id": result.inserted_id})

    room_id = str(room["_id"])
    user_role = "Client" if str(request["client_id"]) == user["_id"] else "Provider"

    await manager.connect(request_id, websocket, user["_id"])

    # Send message history to the connecting user
    messages = await db.chat_messages.find(
        {"room_id": room["_id"]}
    ).sort("timestamp", -1).limit(50).to_list(length=50)

    messages = [_serialize_msg(msg) for msg in messages]
    messages.reverse()

    await websocket.send_json({"type": "history", "messages": messages})
    await mark_messages_as_read(room_id, user["_id"])

    # Tell connecting user who is already online in this room
    await manager.send_to(websocket, {
        "type": "presence_init",
        "online_users": manager.get_online_users(request_id)
    })

    # Tell everyone else this user just came online
    await manager.broadcast_except(request_id, {
        "type": "presence",
        "user_id": user["_id"],
        "status": "online"
    }, exclude_ws=websocket)

    try:
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type", "text")

            if message_type == "text":
                content = data.get("content", "")
                if content.strip():
                    saved_msg = await save_message(room_id, user["_id"], content, "text")
                    await manager.broadcast(request_id, {"type": "text", "message": saved_msg})

            elif message_type == "typing":
                await manager.broadcast(request_id, {
                    "type": "typing",
                    "user_id": user["_id"],
                    "user_role": user_role
                })

            elif message_type == "read":
                await mark_messages_as_read(room_id, user["_id"])

            elif message_type == "offer":
                # Provider sent offer via HTTP — broadcast the saved message to both parties
                await manager.broadcast(request_id, data)

            elif message_type == "offer_update":
                # Client accepted/negotiated via HTTP — broadcast the updated message to both parties
                await manager.broadcast(request_id, data)

            elif message_type == "confirmed":
                # Both confirmed via HTTP — broadcast so the other party's UI updates
                await manager.broadcast(request_id, {"type": "confirmed"})

            elif message_type == "cancelled":
                # Request cancelled via HTTP — broadcast so the other party navigates away
                await manager.broadcast(request_id, data)

            elif message_type == "job_completed":
                # Provider marked job done — broadcast so client's UI updates immediately
                await manager.broadcast(request_id, {"type": "job_completed"})

            elif message_type == "provider_location":
                # Provider GPS position — broadcast so client sees marker move in real-time
                await manager.broadcast(request_id, data)

            elif message_type == "client_location":
                # Client stored position — broadcast once so provider knows destination
                await manager.broadcast(request_id, data)

    except WebSocketDisconnect:
        manager.disconnect(request_id, websocket, user["_id"])
        await manager.broadcast(request_id, {
            "type": "presence",
            "user_id": user["_id"],
            "status": "offline"
        })
    except Exception:
        manager.disconnect(request_id, websocket, user["_id"])
        await manager.broadcast(request_id, {
            "type": "presence",
            "user_id": user["_id"],
            "status": "offline"
        })
        try:
            await websocket.close(code=4001, reason="Error occurred")
        except:
            pass
