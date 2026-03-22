from fastapi import APIRouter, HTTPException
from app.models.user import UserCreate, UserLogin
from app.services.auth_service import register_user, login_user, verify_otp
from pydantic import BaseModel


router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/register")
async def register(user: UserCreate):
    user_data = user.model_dump()

    created_user = await register_user(user_data)

    if created_user == "email_taken":
        raise HTTPException(status_code=400, detail="Email already registered")
    if created_user == "disposable_email":
        raise HTTPException(status_code=400, detail="Temporary emails are not allowed")


    if created_user == "missing_fields":
        raise HTTPException(status_code=400, detail="Providers must fill: bio, service_categories, experience_years")

    created_user["_id"] = str(created_user["_id"])

    return {"message": "User registered successfully", "user": created_user}

@router.post("/login")
async def login(user: UserLogin):
    result = await login_user(user.email, user.password)

    if result == "invalid_credentials":
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {"message": "Verification code sent to your email"}


class OTPVerify(BaseModel):
    email: str
    code: str

@router.post("/verify-otp")
async def verify_otp_endpoint(data: OTPVerify):
    result = await verify_otp(data.email, data.code)

    if result == "invalid_otp":
        raise HTTPException(status_code=400, detail="Invalid verification code")

    if result == "expired_otp":
        raise HTTPException(status_code=400, detail="Code expired, please login again")

    return result

