import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def fix_data_aggressive():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.khadamni
    
    # Coordinates for Tunis as a default
    default_lat = 36.8065
    default_lng = 10.1815
    
    print("Aggressively repairing provider profiles...")
    profiles = await db.provider_profiles.find().to_list(100)
    
    for p in profiles:
        updates = {}
        
        # Ensure lat/lng exist
        lat = p.get("latitude") or default_lat
        lng = p.get("longitude") or default_lng
        
        updates["latitude"] = lat
        updates["longitude"] = lng
        updates["location"] = {
            "type": "Point",
            "coordinates": [float(lng), float(lat)]
        }
        updates["is_available"] = True
        
        # Standardize categories
        if "service_categories" in p:
            updates["service_categories"] = [c.strip() for c in p["service_categories"] if c.strip()]
        else:
            updates["service_categories"] = ["Plumbing"] # Default for testing

        await db.provider_profiles.update_one({"_id": p["_id"]}, {"$set": updates})
        print(f"  Aggressively fixed {p['_id']} (Lat: {lat}, Lng: {lng})")

    print("Repair complete.")

if __name__ == "__main__":
    asyncio.run(fix_data_aggressive())
