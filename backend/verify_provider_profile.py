import asyncio
import json
from bson import ObjectId
from app.database import get_db, connect_db
from app.services.profile_service import get_my_profile

async def test():
    await connect_db()
    db = get_db()
    
    # 1. Create a test provider
    email = "provider_test@example.com"
    await db.users.delete_many({"email": email})
    user_result = await db.users.insert_one({
        "first_name": "Pro",
        "last_name": "Tester",
        "email": email,
        "role": "provider",
        "password": "hashed_pw",
        "phone": "555-0199"
    })
    user_id = user_result.inserted_id

    # 2. Create provider profile
    await db.provider_profiles.delete_many({"user_id": user_id})
    await db.provider_profiles.insert_one({
        "user_id": user_id,
        "full_name": "Pro Tester",
        "bio": "Expert tester for Khadamni.",
        "service_categories": ["Testing", "Debugging"],
        "hourly_rate": 50,
        "is_available": True
    })

    # 3. Add dummy ratings
    await db.ratings.insert_many([
        {"provider_id": user_id, "score": 5, "comment": "Great!"},
        {"provider_id": user_id, "score": 4, "comment": "Good."}
    ])

    # 4. Add dummy completed job
    await db.requests.insert_one({
        "provider_id": user_id,
        "client_id": ObjectId(),
        "status": "completed",
        "description": "Fixed the profile bug"
    })

    # 5. Verify Aggregation
    profile = await get_my_profile(str(user_id))
    print("--- PROVIDER PROFILE VIEW ---")
    print(json.dumps(profile, indent=2, default=str))

if __name__ == "__main__":
    asyncio.run(test())
