from fastapi import APIRouter, HTTPException
from app.models.user import UserCreate
from app.services.auth_service import register_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/register")
async def register(user: UserCreate):
    # Convert pydantic model to dict
    user_data = user.model_dump()

    # Call the service
    created_user = await register_user(user_data)

    # If None, email was taken
    if not created_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Convert MongoDB _id to string
    created_user["_id"] = str(created_user["_id"])

    return {"message": "User registered successfully", "user": created_user}
