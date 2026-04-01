from app.database import get_db
from bson import ObjectId


async def get_my_profile(user_id: str):
    db = get_db()

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return "not_found"

    user["_id"] = str(user["_id"])
    user.pop("password", None)
    # Member since date from ObjectId
    user["member_since"] = ObjectId(user_id).generation_time.strftime("%B %Y")

    if user.get("role") == "provider":
        profile = await db.provider_profiles.find_one({"user_id": ObjectId(user_id)})
        if profile:
            profile["_id"] = str(profile["_id"])
            profile["user_id"] = str(profile["user_id"])
            user["provider_profile"] = profile
        
        # Aggregated stats for provider
        ratings = await db.ratings.find({"provider_id": ObjectId(user_id)}).to_list(length=None)
        user["rating_avg"] = sum(r["score"] for r in ratings) / len(ratings) if ratings else 0
        user["total_reviews"] = len(ratings)
        user["completed_jobs"] = await db.requests.count_documents({
            "provider_id": ObjectId(user_id),
            "status": "completed"
        })
    else:
        # Aggregated stats for client
        user["total_requests"] = await db.requests.count_documents({"client_id": ObjectId(user_id)})
        user["active_requests"] = await db.requests.count_documents({
            "client_id": ObjectId(user_id),
            "status": {"$in": ["pending", "accepted"]}
        })

    return user


async def update_my_profile(user_id: str, role: str, data: dict):
    db = get_db()

    # Remove None values — only update fields that were actually sent
    data = {k: v for k, v in data.items() if v is not None}
    if not data:
        return "no_changes"

    # Fields that belong to the users collection
    user_fields = {"first_name", "last_name", "phone", "latitude", "longitude", "avatar"}

    # Fields that belong to the provider_profiles collection
    provider_fields = {"bio", "service_categories", "hourly_rate", "experience_years", "is_available"}

    user_update = {k: v for k, v in data.items() if k in user_fields}
    provider_update = {k: v for k, v in data.items() if k in provider_fields}

    if user_update:
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": user_update}
        )

    if provider_update and role == "provider":
        # Also keep full_name in sync if name changed
        if "first_name" in user_update or "last_name" in user_update:
            user = await db.users.find_one({"_id": ObjectId(user_id)})
            provider_update["full_name"] = f"{user['first_name']} {user['last_name']}"

        # Update location GeoJSON if coordinates changed
        if "latitude" in user_update and "longitude" in user_update:
            provider_update["latitude"] = data["latitude"]
            provider_update["longitude"] = data["longitude"]
            provider_update["location"] = {
                "type": "Point",
                "coordinates": [data["longitude"], data["latitude"]]
            }

        await db.provider_profiles.update_one(
            {"user_id": ObjectId(user_id)},
            {"$set": provider_update}
        )

    return "ok"
