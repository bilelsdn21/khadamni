from app.database import get_db
from app.utils.security import hash_password, verify_password, create_access_token
import secrets
from datetime import datetime, timezone, timedelta
from app.utils.validators import is_disposable_email
from app.utils.email import send_otp_email


async def register_user(user_data: dict):
    db = get_db()

    if is_disposable_email(user_data["email"]):
        return "disposable_email"

    # 1. Check if email already exists
    existing = await db.users.find_one({"email": user_data["email"]})
    if existing:
        return "email_taken"

    # 2. Validate provider-specific fields
    if user_data["role"] == "provider":
        required = ["bio", "service_categories", "experience_years"]
        for field in required:
            if not user_data.get(field):
                return "missing_fields"

    # 3. Hash the password
    user_data["password"] = hash_password(user_data["password"])

    # 4. Save user to database
    result = await db.users.insert_one(user_data)

    # 5. If provider, auto-create their profile in a separate collection
    if user_data["role"] == "provider":
        provider_profile = {
            "user_id": result.inserted_id,
            "full_name": f"{user_data['first_name']} {user_data['last_name']}",
            "bio": user_data.get("bio", ""),
            "service_categories": user_data.get("service_categories", []),
            "hourly_rate": user_data.get("hourly_rate"),
            "experience_years": user_data.get("experience_years"),
            "phone": user_data.get("phone"),
            "rating_avg": 0,
            "rating_count": 0,
            "total_jobs": 0,
            "is_available": False,
        }
        await db.provider_profiles.insert_one(provider_profile)

    # 6. Return the created user (without password)
    created_user = await db.users.find_one({"_id": result.inserted_id})
    created_user.pop("password", None)

    return created_user


async def login_user(email: str, password: str):
    db = get_db()

    # 1. Find user by email
    user = await db.users.find_one({"email": email})
    if not user:
        return "invalid_credentials"

    # 2. Check password
    if not verify_password(password, user["password"]):
        return "invalid_credentials"
    
    # 3. Generate OTP code
    otp_code = str(secrets.randbelow(900000) + 100000)

    # 4. Save OTP to database with 5 minute expiry
    await db.otp_codes.insert_one({
        "email": email,
        "code": otp_code,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5)
    })

    # 5. Send OTP to user's email
    await send_otp_email(email, otp_code)

    # 6. Don't return token yet — wait for OTP verification
    return "otp_sent"


async def verify_otp(email: str, code: str):
    db = get_db()

    # 1. Find the OTP record
    otp_record = await db.otp_codes.find_one({"email": email, "code": code})
    if not otp_record:
        return "invalid_otp"

    # 2. Check if expired
    if datetime.now(timezone.utc) > otp_record["expires_at"]:
        await db.otp_codes.delete_one({"_id": otp_record["_id"]})
        return "expired_otp"

    # 3. Delete OTP so it can't be used again
    await db.otp_codes.delete_one({"_id": otp_record["_id"]})

    # 4. Get user and return token
    user = await db.users.find_one({"email": email})
    token = create_access_token({"sub": str(user["_id"])})
    user["_id"] = str(user["_id"])
    user.pop("password", None)

    return {"access_token": token, "user": user}

 

