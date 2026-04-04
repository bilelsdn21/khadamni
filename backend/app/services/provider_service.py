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

async def get_all_providers(category: str = None, search: str = None, only_available: bool = True, page: int = 1, per_page: int = 30):
    """In-place providers only (has location, job_type is in_place or both)."""
    db = get_db()
    query = {
        "location": {"$exists": True},
        "job_type": {"$nin": ["remote"]},   # exclude remote-only; in_place, both, null/missing all pass
    }

    if only_available:
        query["is_available"] = True

    if category and category != "All":
        query["service_categories"] = {"$in": [category]}

    if search:
        search_filter = {
            "$or": [
                {"full_name": {"$regex": search, "$options": "i"}},
                {"service_categories": {"$regex": search, "$options": "i"}}
            ]
        }
        query = {"$and": [query, search_filter]}

    total = await db.provider_profiles.count_documents(query)
    skip = (page - 1) * per_page
    providers = await db.provider_profiles.find(query).skip(skip).limit(per_page).to_list(length=per_page)
    for p in providers:
        p["_id"] = str(p["_id"])
        p["user_id"] = str(p["user_id"])
    return {"providers": providers, "total": total, "page": page, "per_page": per_page, "total_pages": max(1, -(-total // per_page))}


async def get_remote_providers(category: str = None, search: str = None):
    """Remote providers (job_type is remote or both)."""
    db = get_db()
    query = {"job_type": {"$in": ["remote", "both"]}, "is_available": True}

    if category and category != "All":
        query["service_categories"] = {"$in": [category]}

    if search:
        search_filter = {
            "$or": [
                {"full_name": {"$regex": search, "$options": "i"}},
                {"service_categories": {"$regex": search, "$options": "i"}}
            ]
        }
        query = {"$and": [query, search_filter]}

    providers = await db.provider_profiles.find(query).to_list(length=100)
    for p in providers:
        p["_id"] = str(p["_id"])
        p["user_id"] = str(p["user_id"])
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
        if not profile:
            return None

        user = await db.users.find_one({"_id": profile["user_id"]})
        if not user:
            return None

        profile["_id"] = str(profile["_id"])
        profile["user_id"] = str(profile["user_id"])
        user["_id"] = str(user["_id"])
        user.pop("password", None)
        user["provider_profile"] = profile
        # Lift rating fields to top level so Profile.jsx can read them consistently
        user["rating_avg"] = profile.get("rating_avg", 0)
        user["total_reviews"] = profile.get("rating_count", 0)
        return user
    except:
        return None

    