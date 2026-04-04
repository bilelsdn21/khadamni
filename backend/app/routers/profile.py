import os
import uuid
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from app.dependencies import get_current_user
from app.models.profile import ClientProfileUpdate, ProviderProfileUpdate
from app.services.profile_service import get_my_profile, update_my_profile
from app.utils.security import hash_password, verify_password
from app.database import get_db
from bson import ObjectId
from pydantic import BaseModel

router = APIRouter(prefix="/api/profile", tags=["Profile"])

UPLOAD_DIR = "uploads"
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE = 5 * 1024 * 1024  # 5MB


@router.get("/me")
async def get_profile(current_user: dict = Depends(get_current_user)):
    result = await get_my_profile(current_user["_id"])
    if result == "not_found":
        raise HTTPException(status_code=404, detail="User not found")
    return result


@router.put("/me")
async def update_profile(
    data: ProviderProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    result = await update_my_profile(
        current_user["_id"],
        current_user["role"],
        data.model_dump()
    )
    if result == "no_changes":
        raise HTTPException(status_code=400, detail="No fields to update")
    return {"message": "Profile updated"}


@router.post("/me/avatar")
async def upload_avatar(
    image: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WebP images are allowed")
    contents = await image.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="Image must be under 5MB")

    ext = image.filename.rsplit(".", 1)[-1].lower()
    filename = f"avatar_{current_user['_id']}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    db = get_db()
    # Delete old avatar file if present
    user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
    old_avatar = user.get("avatar") if user else None
    if old_avatar and old_avatar != filename:
        old_path = os.path.join(UPLOAD_DIR, old_avatar)
        if os.path.exists(old_path):
            os.remove(old_path)

    await db.users.update_one({"_id": ObjectId(current_user["_id"])}, {"$set": {"avatar": filename}})
    # Also sync to provider_profiles for map popups
    if current_user["role"] == "provider":
        await db.provider_profiles.update_one({"user_id": ObjectId(current_user["_id"])}, {"$set": {"avatar": filename}})

    return {"avatar": filename}


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


@router.post("/me/password")
async def change_password(data: PasswordChange, current_user: dict = Depends(get_current_user)):
    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(data.current_password, user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": {"password": hash_password(data.new_password)}}
    )
    return {"message": "Password changed successfully"}
