from fastapi import APIRouter, HTTPException, Depends
from app.models.user import UserCreate, UserLogin, OTPVerify
from app.dependencies import get_current_user
from app.services.auth_service import register_user, login_user, verify_otp, remove_trusted_devices
from app.database import get_db
from bson import ObjectId

# Using models from app.models.user

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Return fresh user data including provider_profile — used on app load to sync stale localStorage."""
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["_id"] = str(user["_id"])
    user.pop("password", None)
    if user.get("role") == "provider":
        profile = await db.provider_profiles.find_one({"user_id": ObjectId(current_user["_id"])})
        if profile:
            profile["_id"] = str(profile["_id"])
            profile["user_id"] = str(profile["user_id"])
            user["provider_profile"] = profile
    return user

@router.post("/remove-devices")
async def revoke_devices(current_user: dict = Depends(get_current_user)):
    await remove_trusted_devices(current_user["email"])
    return {"message": "All trusted devices removed"}

@router.post("/register")
async def register(user: UserCreate):
    try:
        user_data = user.model_dump()
        created_user = await register_user(user_data)

        if created_user == "email_taken":
            raise HTTPException(status_code=400, detail="Email already registered")
        if created_user == "disposable_email":
            raise HTTPException(status_code=400, detail="Temporary emails are not allowed")
        if created_user == "missing_fields":
            raise HTTPException(status_code=400, detail="Providers must fill: bio, service_categories, experience_years, and location")

        created_user["_id"] = str(created_user["_id"])
        return {"message": "User registered successfully", "user": created_user}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Register error: {str(e)}")

@router.post("/login")
async def login(user: UserLogin):
    try:
        result = await login_user(user.email, user.password, user.remember_me, user.device_token)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")

    if result == "invalid_credentials":
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # trusted device — skip OTP
    if isinstance(result, dict):
        return result

    return {"message": "Verification code sent to your email"}

@router.post("/verify-otp")
async def verify_otp_endpoint(data: OTPVerify):
    result = await verify_otp(data.email, data.code, data.remember_me)

    if result == "invalid_otp":
        raise HTTPException(status_code=400, detail="Invalid verification code")

    if result == "expired_otp":
        raise HTTPException(status_code=400, detail="Code expired, please login again")

    return result

