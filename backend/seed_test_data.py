import asyncio
import os
import sys
from datetime import datetime, timezone

# Add the current directory to the path so we can import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# Configuration
MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "khadamni"

# Hardcoded bcrypt hash for "password"
# Using a valid static hash to bypass local hashing issues
STATIC_HASH = "$2b$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGaOtZyMiGaOtZyMiGaOtZyMiG"

SERVICE_CATEGORIES = [
    'Plumbing', 'Electrical', 'Cleaning', 'Painting',
    'Tutoring', 'Delivery', 'IT Support', 'Carpentry',
    'Gardening', 'Moving', 'Cooking', 'AC Repair', 'Locksmith'
]

async def seed_test_data():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("Clearing existing test data...")
    await db.users.delete_many({"email": {"$regex": "@test.com$"}})
    await db.provider_profiles.delete_many({"full_name": {"$regex": "^Expert "}})
    
    # 1. Create a Test Client
    client_email = "client@test.com"
    client_user = {
        "first_name": "Test",
        "last_name": "Client",
        "email": client_email,
        "password": STATIC_HASH,
        "role": "client",
        "phone": "12345678",
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.users.insert_one(client_user)
    print(f"Created Test Client: {client_email}")

    # 2. Create Test Providers
    center_lat = 36.8065
    center_lng = 10.1815
    
    print(f"Seeding {len(SERVICE_CATEGORIES)} providers...")
    
    for i, cat in enumerate(SERVICE_CATEGORIES):
        provider_email = f"{cat.lower().replace(' ', '_')}@test.com"
        
        lat = center_lat + (0.005 * ((i % 5) - 2))
        lng = center_lng + (0.005 * ((i // 5) - 1))
        
        user_data = {
            "first_name": "Expert",
            "last_name": cat,
            "email": provider_email,
            "password": STATIC_HASH,
            "role": "provider",
            "phone": f"9876543{i}",
            "bio": f"Hi, I'm a professional {cat} expert with over 10 years of experience.",
            "service_categories": [cat],
            "hourly_rate": 20.0 + i,
            "experience_years": "10",
            "latitude": lat,
            "longitude": lng,
            "created_at": datetime.now(timezone.utc)
        }
        
        user_result = await db.users.insert_one(user_data)
        user_id = user_result.inserted_id
        
        profile_data = {
            "user_id": user_id,
            "full_name": f"Expert {cat}",
            "bio": user_data["bio"],
            "service_categories": [cat],
            "hourly_rate": user_data["hourly_rate"],
            "experience_years": user_data["experience_years"],
            "phone": user_data["phone"],
            "rating_avg": 4.5 + (i % 5) * 0.1,
            "rating_count": 10 + i,
            "total_jobs": 5 + i,
            "is_available": True,
            "latitude": lat,
            "longitude": lng,
            "location": {
                "type": "Point",
                "coordinates": [float(lng), float(lat)]
            },
            "updated_at": datetime.now(timezone.utc)
        }
        
        await db.provider_profiles.insert_one(profile_data)
        print(f"  Added provider: {provider_email}")

    print("\nSeeding complete!")
    print(f"Client Login: {client_email} / password")
    print(f"Provider Login: plumbing@test.com / password")

if __name__ == "__main__":
    asyncio.run(seed_test_data())
