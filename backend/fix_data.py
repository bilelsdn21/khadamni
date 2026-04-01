import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def fix_data():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.khadamni
    
    print("Repairing provider profiles...")
    profiles = await db.provider_profiles.find().to_list(100)
    
    for p in profiles:
        updates = {}
        
        # 1. Clean categories
        if "service_categories" in p:
            raw = p["service_categories"]
            clean = [c.strip() for c in raw if c.strip()]
            if clean != raw:
                updates["service_categories"] = clean
                print(f"  Fixed categories for {p['_id']}")
        
        # 2. Fix location
        lat = p.get("latitude")
        lng = p.get("longitude")
        if lat is not None and lng is not None:
            new_loc = {
                "type": "Point",
                "coordinates": [float(lng), float(lat)]
            }
            if p.get("location") != new_loc:
                updates["location"] = new_loc
                print(f"  Fixed location for {p['_id']}")
        
        # 3. Force available for testing
        if p.get("is_available") is not True:
            updates["is_available"] = True
            print(f"  Set as available for {p['_id']}")

        if updates:
            await db.provider_profiles.update_one({"_id": p["_id"]}, {"$set": updates})

    print("Repair complete.")

if __name__ == "__main__":
    asyncio.run(fix_data())
