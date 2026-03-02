from app.database import get_db
from app.utils.security import hash_password

async def register_user(user_data: dict):
    db = get_db()

    # 1. Check if email already exists
    existing = await db.users.find_one({"email": user_data["email"]})
    if existing:
        return "email_taken"

    # 2. Validate provider-specific fields
    if user_data["role"] == "provider":
        required = ["bio", "service_categories", "experience_years"]
        for field in required:
            if not user_data.get(field):
                return "missing_fields"

    # 3. Hash the password
    user_data["password"] = hash_password(user_data["password"])

    # 4. Save user to database
    result = await db.users.insert_one(user_data)

    # 5. If provider, auto-create their profile in a separate collection
    if user_data["role"] == "provider":
        provider_profile = {
            "user_id": result.inserted_id,
            "full_name": f"{user_data['first_name']} {user_data['last_name']}",
            "bio": user_data.get("bio", ""),
            "service_categories": user_data.get("service_categories", []),
            "hourly_rate": user_data.get("hourly_rate"),
            "experience_years": user_data.get("experience_years"),
            "phone": user_data.get("phone"),
            "rating_avg": 0,
            "rating_count": 0,
            "total_jobs": 0,
            "is_available": False,
        }
        await db.provider_profiles.insert_one(provider_profile)

    # 6. Return the created user (without password)
    created_user = await db.users.find_one({"_id": result.inserted_id})
    created_user.pop("password", None)

    return created_user
