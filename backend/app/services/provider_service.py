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

async def get_all_providers(category: str = None, search: str = None, only_available: bool = True):
    db = get_db()
    query = {"location": {"$exists": True}}
    
    if only_available:
        query["is_available"] = True
    
    if category and category != "All":
        query["service_categories"] = {"$in": [category]}

    if search:
        # Regex search on full_name or one of the service_categories
        search_filter = {
            "$or": [
                {"full_name": {"$regex": search, "$options": "i"}},
                {"service_categories": {"$regex": search, "$options": "i"}}
            ]
        }
        if query:
            query = {"$and": [query, search_filter]}
        else:
            query = search_filter

    providers = await db.provider_profiles.find(query).to_list(length=100)

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

async def get_provider_by_id(provider_id: str):
    db = get_db()
    try:
        profile = await db.provider_profiles.find_one({"_id": ObjectId(provider_id)})
        if profile:
            profile["_id"] = str(profile["_id"])
            profile["user_id"] = str(profile["user_id"])
        return profile
    except:
        return None

    