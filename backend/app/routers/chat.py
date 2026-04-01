from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from typing import Optional
from pydantic import BaseModel
from app.services.chat_service import (
    get_or_create_chat_room, get_room_messages, send_offer,
    update_offer_status, confirm_agreement, cancel_request,
    save_message, mark_messages_as_read
)
from app.dependencies import get_current_user
from app.database import get_db
from jose import jwt, JWTError
from app.config import settings
from bson import ObjectId
import json
from datetime import datetime, timezone

router = APIRouter(prefix="/api/chat", tags=["Chat"])


# Pydantic schemas
class OfferCreate(BaseModel):
    amount: float
    note: Optional[str] = ""


class OfferUpdate(BaseModel):
    status: str  # accepted or negotiating


class MessageResponse(BaseModel):
    id: str
    room_id: str
    sender_id: str
    message: str
    message_type: str
    offer_amount: Optional[float] = None
    offer_note: Optional[str] = None
    offer_status: Optional[str] = None
    timestamp: datetime
    is_read: bool


class ChatRoomResponse(BaseModel):
    room: dict
    messages: list
    other_party_name: str
    other_party_id: str
    service_category: str
    request_status: str


def _map_error(result: str):
    if result == "not_found":
        raise HTTPException(status_code=404, detail="Chat room or request not found")
    if result == "forbidden":
        raise HTTPException(status_code=403, detail="You are not authorized to access this chat")
    if result == "invalid_status":
        raise HTTPException(status_code=400, detail="Invalid action for current status")


@router.get("/{request_id}")
async def get_chat_room(request_id: str, current_user: dict = Depends(get_current_user)):
    """Get or create chat room for a request."""
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
    return result


@router.patch("/{request_id}/confirm")
async def confirm(request_id: str, current_user: dict = Depends(get_current_user)):
    """User confirms the agreement."""
    result = await confirm_agreement(request_id, current_user["_id"])
    if isinstance(result, str):
        _map_error(result)
    return result


@router.patch("/{request_id}/cancel")
async def cancel(request_id: str, current_user: dict = Depends(get_current_user)):
    """Either party cancels the request."""
    result = await cancel_request(request_id, current_user["_id"])
    if isinstance(result, str):
        _map_error(result)
    return result


# WebSocket connection pool
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, request_id: str, websocket: WebSocket):
        await websocket.accept()
        if request_id not in self.active_connections:
            self.active_connections[request_id] = []
        self.active_connections[request_id].append(websocket)

    def disconnect(self, request_id: str, websocket: WebSocket):
        if request_id in self.active_connections:
            self.active_connections[request_id].remove(websocket)
            if not self.active_connections[request_id]:
                del self.active_connections[request_id]

    async def broadcast(self, request_id: str, message: dict):
        if request_id in self.active_connections:
            for connection in self.active_connections[request_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass

    def get_connection_count(self, request_id: str) -> int:
        return len(self.active_connections.get(request_id, []))


manager = ConnectionManager()


async def get_user_from_token(token: str):
    """Validate JWT token and return user."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
    except JWTError:
        return None

    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return None

    user["_id"] = str(user["_id"])
    return user


@router.websocket("/ws/{request_id}")
async def websocket_endpoint(websocket: WebSocket, request_id: str, token: str = None):
    """WebSocket endpoint for real-time chat."""
    # Validate token
    if not token:
        await websocket.close(code=4001, reason="Token required")
        return

    user = await get_user_from_token(token)
    if not user:
        await websocket.close(code=4001, reason="Invalid token")
        return

    # Verify user is authorized for this request
    db = get_db()
    request = await db.service_requests.find_one({"_id": ObjectId(request_id)})
    if not request:
        await websocket.close(code=4001, reason="Request not found")
        return

    if str(request["client_id"]) != user["_id"] and str(request["provider_id"]) != user["_id"]:
        await websocket.close(code=4001, reason="Not authorized")
        return

    # Check connection limit (max 2 per room)
    if manager.get_connection_count(request_id) >= 2:
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

    # Connect
    await manager.connect(request_id, websocket)

    # Send last 50 messages as history
    messages = await db.chat_messages.find(
        {"room_id": room["_id"]}
    ).sort("timestamp", -1).limit(50).to_list(length=50)

    for msg in messages:
        msg["_id"] = str(msg["_id"])
        msg["room_id"] = str(msg["room_id"])
        msg["sender_id"] = str(msg["sender_id"])
    messages.reverse()

    await websocket.send_json({
        "type": "history",
        "messages": messages
    })

    # Mark messages as read
    await mark_messages_as_read(room_id, user["_id"])

    # Determine user role
    user_role = "Client" if str(request["client_id"]) == user["_id"] else "Provider"

    # Broadcast join message
    await manager.broadcast(request_id, {
        "type": "system",
        "message": f"{user_role} has joined the chat"
    })

    try:
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type", "text")

            if message_type == "text":
                content = data.get("content", "")
                if content.strip():
                    # Save message to database
                    saved_msg = await save_message(room_id, user["_id"], content, "text")
                    # Broadcast to other connection
                    await manager.broadcast(request_id, {
                        "type": "text",
                        "message": saved_msg
                    })

            elif message_type == "typing":
                # Broadcast typing indicator
                await manager.broadcast(request_id, {
                    "type": "typing",
                    "user_id": user["_id"],
                    "user_role": user_role
                })

            elif message_type == "read":
                # Mark messages as read
                await mark_messages_as_read(room_id, user["_id"])

    except WebSocketDisconnect:
        manager.disconnect(request_id, websocket)
        # Broadcast leave message
        await manager.broadcast(request_id, {
            "type": "system",
            "message": f"{user_role} has left the chat"
        })
    except Exception as e:
        manager.disconnect(request_id, websocket)
        try:
            await websocket.close(code=4001, reason="Error occurred")
        except:
            pass
