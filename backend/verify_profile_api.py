import asyncio
import json
from app.database import get_db, connect_db
from app.services.profile_service import get_my_profile

async def test():
    await connect_db()
    db = get_db()
    user = await db.users.find_one({"email": "test456@example.com"})
    if not user:
        print("USER_NOT_FOUND")
        return
    
    profile = await get_my_profile(str(user["_id"]))
    print("--- PROFILE API RESPONSE ---")
    # Use a custom encoder for datetime objects if needed, but get_my_profile str()s the ID and we only need to see the keys
    # Actually member_since is a string now.
    print(json.dumps(profile, indent=2, default=str))

if __name__ == "__main__":
    asyncio.run(test())
