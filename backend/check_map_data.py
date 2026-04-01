import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def check_data():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.khadamni
    
    print("--- PROVIDERS ---")
    providers = await db.provider_profiles.find().to_list(100)
    for p in providers:
        print(f"User: {p.get('user_id')}, Available: {p.get('is_available')}, Categories: {p.get('service_categories')}, Location: {p.get('location')}")

if __name__ == "__main__":
    asyncio.run(check_data())
