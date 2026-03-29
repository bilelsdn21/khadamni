from app.database import get_db
from datetime import datetime, timezone
from bson import ObjectId


async def create_request(client_id: str, provider_id: str, description: str):
    db = get_db()

    user = await db.users.find_one({"_id": ObjectId(client_id)})
    provider = await db.provider_profiles.find_one({"_id": ObjectId(provider_id)})

    document = {
        "client_id": ObjectId(client_id),
        "provider_id": ObjectId(provider_id),
        "client_name": f"{user['first_name']} {user['last_name']}",
        "provider_name": provider["full_name"],
        "description": description,
        "status": "pending",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    result = await db.service_requests.insert_one(document)
    return str(result.inserted_id)


async def get_my_requests(user_id: str, role: str):
    db = get_db()

    if role == "client":
        requests = await db.service_requests.find({"client_id": ObjectId(user_id)}).to_list(length=50)
    else:
        requests = await db.service_requests.find({"provider_id": ObjectId(user_id)}).to_list(length=50)

    for r in requests:
        r["_id"] = str(r["_id"])
        r["client_id"] = str(r["client_id"])
        r["provider_id"] = str(r["provider_id"])

    return requests


async def accept_request(request_id: str):
    db = get_db()
    await db.service_requests.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {
            "status": "in_progress",
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    return True


async def reject_request(request_id: str):
    db = get_db()
    await db.service_requests.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {
            "status": "rejected",
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    return True
