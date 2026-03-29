from app.database import get_db
from bson import ObjectId
async def get_all_providers():
    db = get_db()

    providers = await db.provider_profiles.find(
        {"is_available": True, "location": {"$exists": True}}
    ).to_list(length=100)

    for provider in providers:
        provider["_id"] = str(provider["_id"])
        provider["user_id"] = str(provider["user_id"])

    return providers
async def toggle_availble(user_id):
    db=get_db()
    user=db.users.find_one({"_id":ObjectId(user_id)})
    