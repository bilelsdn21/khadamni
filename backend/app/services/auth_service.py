from app.database import get_db
from app.utils.security import hash_password

async def register_user(user_data: dict) -> dict:
    db = get_db()
    
    # 1. Check if email already exists
    existing = await db.users.find_one({"email": user_data["email"]})
    if existing:
        return None  # email taken
    
    # 2. Hash the password
    user_data["password"] = hash_password(user_data["password"])
    
    # 3. Save to database
    result = await db.users.insert_one(user_data)
    
    # 4. Get and return the created user (without password)
    created_user = await db.users.find_one({"_id": result.inserted_id})
    created_user.pop("password", None)
    
    return created_user
