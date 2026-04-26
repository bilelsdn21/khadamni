from app.database import get_db
from datetime import datetime, timezone
from bson import ObjectId


async def create_request(client_id: str, provider_profile_id: str, description: str):
    db = get_db()

    # Fetch client
    user = await db.users.find_one({"_id": ObjectId(client_id)})
    if not user:
        return "not_found"

    # Fetch provider profile by its _id (what the frontend sends)
    provider = await db.provider_profiles.find_one({"_id": ObjectId(provider_profile_id)})
    if not provider:
        return "provider_not_found"

    document = {
        "client_id": ObjectId(client_id),
        "provider_id": provider["user_id"],          # store users._id, not provider_profiles._id
        "provider_profile_id": provider["_id"],      # keep reference for profile lookups
        "client_name": f"{user['first_name']} {user['last_name']}",
        "provider_name": provider["full_name"],
        "description": description,
        "status": "pending",
        "job_type": provider.get("job_type", "in_place"),
        "service_category": (provider.get("service_categories") or ["Unknown"])[0],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    result = await db.service_requests.insert_one(document)
    return str(result.inserted_id)


async def get_my_requests(user_id: str, role: str, status: str = None):
    db = get_db()

    if role == "client":
        query = {"client_id": ObjectId(user_id)}
    else:
        query = {"provider_id": ObjectId(user_id)}

    if status:
        query["status"] = status

    requests = await db.service_requests.find(query).sort("created_at", -1).to_list(length=50)

    for r in requests:
        r["_id"] = str(r["_id"])
        r["client_id"] = str(r["client_id"])
        r["provider_id"] = str(r["provider_id"])
        if r.get("provider_profile_id"):
            r["provider_profile_id"] = str(r["provider_profile_id"])
        # Attach other party avatar
        try:
            other_id = r["client_id"] if role == "provider" else r["provider_id"]
            other_doc = await db.users.find_one({"_id": ObjectId(other_id)}, {"avatar": 1})
            r["other_party_avatar"] = other_doc.get("avatar") if other_doc else None
        except Exception:
            r["other_party_avatar"] = None

        # Attach unread message count for this request's chat room
        try:
            room = await db.chat_rooms.find_one({"request_id": ObjectId(r["_id"])})
        except Exception:
            room = None
        if room:
            r["unread_count"] = await db.chat_messages.count_documents({
                "room_id": room["_id"],
                "sender_id": {"$ne": ObjectId(user_id)},
                "is_read": False,
            })
        else:
            r["unread_count"] = 0

    return requests


async def get_request_by_id(request_id: str, user_id: str):
    db = get_db()

    request = await db.service_requests.find_one({"_id": ObjectId(request_id)})
    if not request:
        return "not_found"

    # Only the client or provider of this request can view it
    if str(request["client_id"]) != user_id and str(request["provider_id"]) != user_id:
        return "forbidden"

    request["_id"] = str(request["_id"])
    request["client_id"] = str(request["client_id"])
    request["provider_id"] = str(request["provider_id"])
    if request.get("provider_profile_id"):
        request["provider_profile_id"] = str(request["provider_profile_id"])

    return request


async def accept_request(request_id: str, provider_user_id: str):
    db = get_db()

    request = await db.service_requests.find_one({"_id": ObjectId(request_id)})
    if not request:
        return "not_found"
    if str(request["provider_id"]) != provider_user_id:
        return "forbidden"
    if request["status"] != "pending":
        return "invalid_status"

    await db.service_requests.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "in_progress", "updated_at": datetime.now(timezone.utc)}}
    )
    return "ok"


async def reject_request(request_id: str, provider_user_id: str):
    db = get_db()

    request = await db.service_requests.find_one({"_id": ObjectId(request_id)})
    if not request:
        return "not_found"
    if str(request["provider_id"]) != provider_user_id:
        return "forbidden"
    if request["status"] != "pending":
        return "invalid_status"

    await db.service_requests.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "rejected", "updated_at": datetime.now(timezone.utc)}}
    )
    return "ok"


async def complete_request(request_id: str, provider_user_id: str):
    db = get_db()

    request = await db.service_requests.find_one({"_id": ObjectId(request_id)})
    if not request:
        return "not_found"
    if str(request["provider_id"]) != provider_user_id:
        return "forbidden"
    if request["status"] not in ("in_progress", "confirmed"):
        return "invalid_status"

    await db.service_requests.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "completed", "updated_at": datetime.now(timezone.utc)}}
    )

    # Increment provider's total_jobs count
    await db.provider_profiles.update_one(
        {"user_id": ObjectId(provider_user_id)},
        {"$inc": {"total_jobs": 1}}
    )
    return "ok"


async def cancel_request(request_id: str, client_user_id: str):
    db = get_db()

    request = await db.service_requests.find_one({"_id": ObjectId(request_id)})
    if not request:
        return "not_found"
    if str(request["client_id"]) != client_user_id:
        return "forbidden"
    if request["status"] != "pending":
        return "invalid_status"

    await db.service_requests.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "cancelled", "updated_at": datetime.now(timezone.utc)}}
    )
    return "ok"