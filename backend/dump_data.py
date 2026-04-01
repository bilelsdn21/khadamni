import asyncio
import json
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

class MongoEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        return super().default(obj)

async def dump_data():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.khadamni
    
    providers = await db.provider_profiles.find().to_list(10)
    print(json.dumps(providers, indent=2, cls=MongoEncoder))

if __name__ == "__main__":
    asyncio.run(dump_data())
