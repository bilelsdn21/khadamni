from app.database import get_db
from bson import ObjectId
from datetime import datetime, timezone


async def add_portfolio_item(provider_user_id: str, image_paths: list, description: str):
    db = get_db()

    profile = await db.provider_profiles.find_one({"user_id": ObjectId(provider_user_id)})
    if not profile:
        return "not_found"

    result = await db.portfolio_items.insert_one({
        "provider_id": ObjectId(provider_user_id),
        "provider_profile_id": profile["_id"],
        "image_paths": image_paths,
        "description": description,
        "created_at": datetime.now(timezone.utc),
    })
    return str(result.inserted_id)


async def get_portfolio(provider_user_id: str):
    db = get_db()

    items = await db.portfolio_items.find(
        {"provider_id": ObjectId(provider_user_id)}
    ).sort("created_at", -1).to_list(length=50)

    for item in items:
        item["_id"] = str(item["_id"])
        item["provider_id"] = str(item["provider_id"])
        item["provider_profile_id"] = str(item["provider_profile_id"])
        # Normalize: old items have image_path (str), new items have image_paths (list)
        if "image_paths" not in item:
            item["image_paths"] = [item["image_path"]] if item.get("image_path") else []

    return items


async def delete_portfolio_item(item_id: str, provider_user_id: str):
    db = get_db()

    item = await db.portfolio_items.find_one({"_id": ObjectId(item_id)})
    if not item:
        return "not_found"
    if str(item["provider_id"]) != provider_user_id:
        return "forbidden"

    await db.portfolio_items.delete_one({"_id": ObjectId(item_id)})
    return "ok"
