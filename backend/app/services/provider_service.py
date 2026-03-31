from app.database import get_db
from bson import ObjectId

async def update_location(user_id: str, latitude: float, longitude: float):
    db = get_db()
    result = await db.provider_profiles.update_one(
        {"user_id": ObjectId(user_id)},
        {"$set": {
            "latitude": latitude,
            "longitude": longitude,
            "location": {
                "type": "Point",
                "coordinates": [longitude, latitude]
            }
        }}
    )
    if result.matched_count == 0:
        return "not_found"
    return "ok"

async def get_all_providers():
    db = get_db()

    providers = await db.provider_profiles.find(
        {"is_available": True, "location": {"$exists": True}}
    ).to_list(length=100)

    for provider in providers:
        provider["_id"] = str(provider["_id"])
        provider["user_id"] = str(provider["user_id"])

    return providers
async def toggle_availability(user_id: str):
    db = get_db()

    profile = await db.provider_profiles.find_one({"user_id": ObjectId(user_id)})
    if not profile:
        return None

    new_value = not profile["is_available"]
    await db.provider_profiles.update_one(
        {"user_id": ObjectId(user_id)},
        {"$set": {"is_available": new_value}}
    )
    return new_value

    