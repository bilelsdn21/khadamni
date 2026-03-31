from fastapi import APIRouter, HTTPException, Depends
from app.dependencies import get_current_user
from app.models.profile import ClientProfileUpdate, ProviderProfileUpdate
from app.services.profile_service import get_my_profile, update_my_profile

router = APIRouter(prefix="/api/profile", tags=["Profile"])


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
