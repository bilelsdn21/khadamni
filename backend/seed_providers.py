import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

SERVICE_CATEGORIES = [
    'Plumbing', 'Electrical', 'Cleaning', 'Painting',
    'Tutoring', 'Delivery', 'IT Support', 'Carpentry',
    'Gardening', 'Moving', 'Cooking', 'Other'
]

async def seed_data():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.khadamni
    
    # Coordinates for center (Tunis)
    center_lat = 36.8065
    center_lng = 10.1815
    
    print(f"Seeding {len(SERVICE_CATEGORIES)} diverse providers around {center_lat}, {center_lng}...")
    
    # Optional: Clear existing test providers
    # await db.provider_profiles.delete_many({"full_name": {"$regex": "^Demo "}})
    
    for i, cat in enumerate(SERVICE_CATEGORIES):
        # Slightly offset each one so they don't overlap perfectly
        offset_lat = center_lat + (0.002 * (i // 4))
        offset_lng = center_lng + (0.002 * (i % 4))
        
        provider_id = ObjectId()
        user_id = ObjectId() # Dummy user ID
        
        provider_profile = {
            "user_id": user_id,
            "full_name": f"Expert {cat}",
            "bio": f"I am a professional in {cat} services with years of experience.",
            "service_categories": [cat],
            "hourly_rate": 2000 + (i * 100),
            "experience_years": 5 + i,
            "rating_avg": 4.0 + (i % 2) * 0.5,
            "rating_count": 10 + i,
            "total_jobs": 20 + i,
            "is_available": True,
            "latitude": offset_lat,
            "longitude": offset_lng,
            "location": {
                "type": "Point",
                "coordinates": [float(offset_lng), float(offset_lat)]
            }
        }
        
        await db.provider_profiles.insert_one(provider_profile)
        print(f"  Added {cat} provider.")

    print("Seeding complete.")

if __name__ == "__main__":
    asyncio.run(seed_data())
