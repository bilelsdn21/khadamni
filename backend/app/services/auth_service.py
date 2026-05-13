from app.database import get_db
from app.utils.security import hash_password, verify_password, create_access_token
import secrets
from datetime import datetime, timezone, timedelta
from app.utils.validators import is_disposable_email
from app.utils.email import send_otp_email
import uuid


async def register_user(user_data: dict):
    db = get_db()
    email = user_data["email"].lower()
    user_data["email"] = email

    if is_disposable_email(email):
        return "disposable_email"

    # 1. Check if email already exists
    existing = await db.users.find_one({"email": email})
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
        # Clean categories (strip whitespace/newlines)
        raw_categories = user_data.get("service_categories", [])
        clean_categories = [c.strip() for c in raw_categories if c and c.strip()]

        lat = user_data.get("latitude")
        lng = user_data.get("longitude")

        provider_profile = {
            "user_id": result.inserted_id,
            "full_name": f"{user_data['first_name']} {user_data['last_name']}",
            "bio": (user_data.get("bio") or "").strip(),
            "service_categories": clean_categories,
            "custom_category": (user_data.get("custom_category") or "").strip() or None,
            "hourly_rate": user_data.get("hourly_rate"),
            "experience_years": user_data.get("experience_years"),
            "phone": user_data.get("phone"),
            "rating_avg": 0,
            "rating_count": 0,
            "total_jobs": 0,
            "is_available": True,
            "job_type": user_data.get("job_type", "in_place"),
            "latitude": lat,
            "longitude": lng,
        }

        # Only add GeoJSON location if both lat and lng are present for map functionality
        if lat is not None and lng is not None:
            provider_profile["location"] = {
                "type": "Point",
                "coordinates": [float(lng), float(lat)]
            }

        await db.provider_profiles.insert_one(provider_profile)

    # 6. Return the created user (without password)
    created_user = await db.users.find_one({"_id": result.inserted_id})
    created_user["_id"] = str(created_user["_id"])
    created_user.pop("password", None)

    return created_user


async def login_user(email: str, password: str, remember_me: bool = False, device_token: str = None):
    db = get_db()
    email = email.lower()

    # 1. Find user by email
    user = await db.users.find_one({"email": email})
    if not user:
        return "invalid_credentials"

    # 2. Check if user is suspended
    if user.get("suspended"):
        until = user.get("suspended_until")
        if until is None:
            # Permanent suspension
            return "account_suspended"
        if until.tzinfo is None:
            until = until.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) < until:
            # Active timed suspension
            return "account_suspended"
        else:
            # Suspension expired — auto-lift
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"suspended": False, "suspended_until": None, "suspended_reason": None}}
            )
            user["suspended"] = False
            user["suspended_until"] = None
            user["suspended_reason"] = None

    # [SPECIAL CASE] Auto-login test accounts (Bypasses bcrypt engine and OTP)
    if email.endswith("@test.com"):
        if user.get("role") == "provider":
            profile = await db.provider_profiles.find_one({"user_id": user["_id"]})
            if profile:
                profile["_id"] = str(profile["_id"])
                profile["user_id"] = str(profile["user_id"])
                user["provider_profile"] = profile
        
        token = create_access_token({"sub": str(user["_id"])}, expires_delta=timedelta(days=30) if remember_me else None)
        user["_id"] = str(user["_id"])
        user.pop("password", None)
        return {"access_token": token, "user": user, "device_token": "test_token"}

    # 2. Check password
    if not verify_password(password, user["password"]):
        return "invalid_credentials"

    # 3. Check valid trusted device token (skip OTP)
    if device_token and device_token != "null" and device_token != "undefined":
        stored = await db.device_tokens.find_one({"email": email, "token": device_token})
        
        if stored:
            # Check for 30-day expiry
            expires_at = stored.get("expires_at")
            now = datetime.now(timezone.utc)
            
            # Ensure expires_at is aware
            if expires_at and expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)

            if expires_at and now > expires_at:
                await db.device_tokens.delete_one({"_id": stored["_id"]})
            else:
                # Token valid -> Authenticate directly
                if user.get("role") == "provider":
                    profile = await db.provider_profiles.find_one({"user_id": user["_id"]})
                    if profile:
                        profile["_id"] = str(profile["_id"])
                        profile["user_id"] = str(profile["user_id"])
                        user["provider_profile"] = profile
                
                expires_jwt = timedelta(days=30) if remember_me else None
                token = create_access_token({"sub": str(user["_id"])}, expires_delta=expires_jwt)
                user["_id"] = str(user["_id"])
                user.pop("password", None)
                return {"access_token": token, "user": user}

    # 4. Rate limit — block if an OTP was already sent in the last 60 seconds
    existing_otp = await db.otp_codes.find_one({"email": email})
    if existing_otp:
        created_at = existing_otp.get("created_at")
        if created_at and (datetime.now(timezone.utc) - created_at).total_seconds() < 60:
            return "rate_limited"

    # 5. Generate OTP code
    otp_code = str(secrets.randbelow(900000) + 100000)

    # 6. Delete any existing OTP for this email, then save new one
    await db.otp_codes.delete_many({"email": email})
    await db.otp_codes.insert_one({
        "email": email,
        "code": otp_code,
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5)
    })

    # 6. Send OTP to user's email
    await send_otp_email(email, otp_code)

    # 7. Don't return token yet — wait for OTP verification
    return "otp_sent"


async def verify_otp(email: str, code: str, remember_me: bool = False):
    db = get_db()
    email = email.lower()

    # 1. Find the OTP record
    otp_record = await db.otp_codes.find_one({"email": email, "code": code})
    if not otp_record:
        return "invalid_otp"

    # 2. Check if expired
    if datetime.now(timezone.utc) > otp_record["expires_at"].replace(tzinfo=timezone.utc):
        await db.otp_codes.delete_one({"_id": otp_record["_id"]})
        return "expired_otp"

    # 3. Delete OTP so it can't be used again
    await db.otp_codes.delete_one({"_id": otp_record["_id"]})

    # 4. Get user and return token
    user = await db.users.find_one({"email": email})

    if user.get("role") == "provider":
        profile = await db.provider_profiles.find_one({"user_id": user["_id"]})
        if profile:
            profile["_id"] = str(profile["_id"])
            profile["user_id"] = str(profile["user_id"])
            user["provider_profile"] = profile

    expires = timedelta(days=30) if remember_me else None
    token = create_access_token({"sub": str(user["_id"])}, expires_delta=expires)
    user["_id"] = str(user["_id"])
    user.pop("password", None)

    response = {"access_token": token, "user": user}

    # 5. Generate NEW trusted device token (UUID) for this device
    device_token = str(uuid.uuid4())
    # Save with 30-day expiry
    await db.device_tokens.insert_one({
        "email": email,
        "token": device_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=30)
    })
    response["device_token"] = device_token

    return response


async def remove_trusted_devices(email: str):
    db = get_db()
    await db.device_tokens.delete_many({"email": email})
    return True


 

