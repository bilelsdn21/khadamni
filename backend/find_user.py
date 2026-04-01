import asyncio
from app.database import get_db, connect_db
import os

os.environ["MONGODB_URL"] = "mongodb://localhost:27017" # Ensure env is set if needed

async def test():
    await connect_db()
    db = get_db()
    user = await db.users.find_one({"role": "provider"})
    if user:
        print(f"USER_EMAIL: {user['email']}")
    else:
        print("NO_PROVIDER_USER")

if __name__ == "__main__":
    asyncio.run(test())
