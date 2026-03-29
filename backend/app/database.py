# database.py — MongoDB Connection
from motor.motor_asyncio import AsyncIOMotorClient
# 2. Import your settings from app.config
from app.config import settings
# 3. Create global variables: client and db (initially None)
client=None
db=None

async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    print(f"Connected to MongoDB: {settings.DATABASE_NAME}")
    await db.provider_profiles.create_index([("location", "2dsphere")])
    print("Geospatial index created")

async def close_db():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")

def get_db():
    return db



