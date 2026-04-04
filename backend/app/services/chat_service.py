from app.database import get_db
from datetime import datetime, timezone
from bson import ObjectId


def _serialize_msg(msg: dict) -> dict:
    """Convert ObjectIds and datetime to JSON-safe strings."""
    msg["_id"] = str(msg["_id"])
    msg["room_id"] = str(msg["room_id"])
    msg["sender_id"] = str(msg["sender_id"])
    if isinstance(msg.get("timestamp"), datetime):
        msg["timestamp"] = msg["timestamp"].isoformat()
    return msg


async def get_or_create_chat_room(request_id: str, user_id: str):
    """Get or create a chat room for a request. Only accessible by client or provider."""
    db = get_db()

    # Verify request exists and user is authorized
    request = await db.service_requests.find_one({"_id": ObjectId(request_id)})
    if not request:
        return "not_found"

    if str(request["client_id"]) != user_id and str(request["provider_id"]) != user_id:
        return "forbidden"

    # Find existing room
    room = await db.chat_rooms.find_one({"request_id": ObjectId(request_id)})

    if not room:
        # Create new room
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

    # Convert ObjectIds to strings
    room["_id"] = str(room["_id"])
    room["request_id"] = str(room["request_id"])
    room["client_id"] = str(room["client_id"])
    room["provider_id"] = str(room["provider_id"])

    # Get last 50 messages
    messages = await db.chat_messages.find(
        {"room_id": ObjectId(room["_id"])}
    ).sort("timestamp", -1).limit(50).to_list(length=50)

    # Convert and reverse messages
    for msg in messages:
        msg["_id"] = str(msg["_id"])
        msg["room_id"] = str(msg["room_id"])
        msg["sender_id"] = str(msg["sender_id"])
    messages.reverse()

    # Get other party info
    other_party_id = room["provider_id"] if str(request["client_id"]) == user_id else room["client_id"]
    other_user = await db.users.find_one({"_id": ObjectId(other_party_id)})
    other_party_name = f"{other_user['first_name']} {other_user['last_name']}" if other_user else "Unknown"

    # Get request info for service category
    provider_profile = await db.provider_profiles.find_one({"user_id": ObjectId(room["provider_id"])})
    service_category = provider_profile.get("category", "Service") if provider_profile else "Service"

    unread_count = await db.chat_messages.count_documents({
        "room_id": ObjectId(room["_id"]),
        "sender_id": {"$ne": ObjectId(user_id)},
        "is_read": False,
    })

    return {
        "room": room,
        "messages": messages,
        "other_party_name": other_party_name,
        "other_party_id": other_party_id,
        "service_category": service_category,
        "request_status": request["status"],
        "unread_count": unread_count,
    }


async def get_room_messages(request_id: str, user_id: str, page: int = 1, per_page: int = 50):
    """Get paginated messages for a chat room."""
    db = get_db()

    # Verify request exists and user is authorized
    request = await db.service_requests.find_one({"_id": ObjectId(request_id)})
    if not request:
        return "not_found"

    if str(request["client_id"]) != user_id and str(request["provider_id"]) != user_id:
        return "forbidden"

    # Get room
    room = await db.chat_rooms.find_one({"request_id": ObjectId(request_id)})
    if not room:
        return "not_found"

    skip = (page - 1) * per_page
    messages = await db.chat_messages.find(
        {"room_id": room["_id"]}
    ).sort("timestamp", -1).skip(skip).limit(per_page).to_list(length=per_page)

    # Convert and reverse
    for msg in messages:
        msg["_id"] = str(msg["_id"])
        msg["room_id"] = str(msg["room_id"])
        msg["sender_id"] = str(msg["sender_id"])
    messages.reverse()

    total = await db.chat_messages.count_documents({"room_id": room["_id"]})

    return {
        "messages": messages,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
    }


async def send_offer(request_id: str, provider_id: str, amount: float, note: str = ""):
    """Provider sends a price offer."""
    db = get_db()

    # Verify request exists and provider is authorized
    request = await db.service_requests.find_one({"_id": ObjectId(request_id)})
    if not request:
        return "not_found"

    if str(request["provider_id"]) != provider_id:
        return "forbidden"

    # Get room
    room = await db.chat_rooms.find_one({"request_id": ObjectId(request_id)})
    if not room:
        return "not_found"

    # Create offer message
    message_doc = {
        "room_id": room["_id"],
        "sender_id": ObjectId(provider_id),
        "message": f"Price offer: {amount} DT",
        "message_type": "offer",
        "offer_amount": amount,
        "offer_note": note,
        "offer_status": "pending",
        "timestamp": datetime.now(timezone.utc),
        "is_read": False,
    }

    result = await db.chat_messages.insert_one(message_doc)
    message = await db.chat_messages.find_one({"_id": result.inserted_id})

    return _serialize_msg(message)


async def update_offer_status(request_id: str, message_id: str, client_id: str, status: str):
    """Client updates offer status to accepted or negotiating."""
    db = get_db()

    # Verify request exists and client is authorized
    request = await db.service_requests.find_one({"_id": ObjectId(request_id)})
    if not request:
        return "not_found"

    if str(request["client_id"]) != client_id:
        return "forbidden"

    # Get message
    message = await db.chat_messages.find_one({"_id": ObjectId(message_id)})
    if not message:
        return "not_found"

    if message["message_type"] != "offer":
        return "invalid_status"

    # Update offer status
    await db.chat_messages.update_one(
        {"_id": ObjectId(message_id)},
        {"$set": {"offer_status": status}}
    )

    # If accepted, update room agreed_price
    if status == "accepted":
        await db.chat_rooms.update_one(
            {"request_id": ObjectId(request_id)},
            {"$set": {"agreed_price": message["offer_amount"], "updated_at": datetime.now(timezone.utc)}}
        )

    updated_message = await db.chat_messages.find_one({"_id": ObjectId(message_id)})
    return _serialize_msg(updated_message)


async def confirm_agreement(request_id: str, user_id: str):
    """User confirms the agreement. Both parties must confirm."""
    db = get_db()

    # Verify request exists and user is authorized
    request = await db.service_requests.find_one({"_id": ObjectId(request_id)})
    if not request:
        return "not_found"

    if str(request["client_id"]) != user_id and str(request["provider_id"]) != user_id:
        return "forbidden"

    # Get room
    room = await db.chat_rooms.find_one({"request_id": ObjectId(request_id)})
    if not room:
        return "not_found"

    # Determine which field to update
    if str(request["client_id"]) == user_id:
        update_field = "client_confirmed"
    else:
        update_field = "provider_confirmed"

    # Update confirmation
    await db.chat_rooms.update_one(
        {"request_id": ObjectId(request_id)},
        {"$set": {update_field: True, "updated_at": datetime.now(timezone.utc)}}
    )

    # Check if both confirmed
    updated_room = await db.chat_rooms.find_one({"request_id": ObjectId(request_id)})
    both_confirmed = updated_room.get("client_confirmed", False) and updated_room.get("provider_confirmed", False)

    if both_confirmed:
        # Update room status
        await db.chat_rooms.update_one(
            {"request_id": ObjectId(request_id)},
            {"$set": {"status": "confirmed", "updated_at": datetime.now(timezone.utc)}}
        )

        # Update request status
        await db.service_requests.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": {"status": "confirmed", "updated_at": datetime.now(timezone.utc)}}
        )

        # Create system message
        system_msg = {
            "room_id": room["_id"],
            "sender_id": ObjectId(user_id),
            "message": "Both parties have confirmed the agreement",
            "message_type": "system",
            "timestamp": datetime.now(timezone.utc),
            "is_read": False,
        }
        await db.chat_messages.insert_one(system_msg)

        return {"status": "both_confirmed", "agreed_price": updated_room.get("agreed_price")}

    return {"status": "waiting", "user_confirmed": True}


async def cancel_request(request_id: str, user_id: str):
    """Either party cancels the request."""
    db = get_db()

    # Verify request exists and user is authorized
    request = await db.service_requests.find_one({"_id": ObjectId(request_id)})
    if not request:
        return "not_found"

    if str(request["client_id"]) != user_id and str(request["provider_id"]) != user_id:
        return "forbidden"

    # Get room
    room = await db.chat_rooms.find_one({"request_id": ObjectId(request_id)})
    if not room:
        return "not_found"

    # Determine who cancelled
    cancelled_by = "Client" if str(request["client_id"]) == user_id else "Provider"

    # Update room status
    await db.chat_rooms.update_one(
        {"request_id": ObjectId(request_id)},
        {"$set": {"status": "cancelled", "updated_at": datetime.now(timezone.utc)}}
    )

    # Update request status
    await db.service_requests.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "cancelled", "updated_at": datetime.now(timezone.utc)}}
    )

    # Create system message
    system_msg = {
        "room_id": room["_id"],
        "sender_id": ObjectId(user_id),
        "message": f"Request was cancelled by {cancelled_by}",
        "message_type": "system",
        "timestamp": datetime.now(timezone.utc),
        "is_read": False,
    }
    await db.chat_messages.insert_one(system_msg)

    return {"status": "cancelled", "cancelled_by": cancelled_by}


async def save_message(room_id: str, sender_id: str, message: str, message_type: str = "text"):
    """Save a chat message to the database."""
    db = get_db()

    message_doc = {
        "room_id": ObjectId(room_id),
        "sender_id": ObjectId(sender_id),
        "message": message,
        "message_type": message_type,
        "timestamp": datetime.now(timezone.utc),
        "is_read": False,
    }

    result = await db.chat_messages.insert_one(message_doc)
    saved_message = await db.chat_messages.find_one({"_id": result.inserted_id})

    return _serialize_msg(saved_message)


async def mark_messages_as_read(room_id: str, user_id: str):
    """Mark all unread messages in a room as read for a user."""
    db = get_db()

    await db.chat_messages.update_many(
        {
            "room_id": ObjectId(room_id),
            "sender_id": {"$ne": ObjectId(user_id)},
            "is_read": False,
        },
        {"$set": {"is_read": True}}
    )
