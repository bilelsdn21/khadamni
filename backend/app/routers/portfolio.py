import os
import uuid
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from app.dependencies import get_current_user
from app.services.portfolio_service import add_portfolio_item, get_portfolio, delete_portfolio_item

router = APIRouter(prefix="/api/portfolio", tags=["Portfolio"])

UPLOAD_DIR = "uploads"
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/")
async def upload_item(
    description: str = Form(...),
    image: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] != "provider":
        raise HTTPException(status_code=403, detail="Only providers can add portfolio items")

    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WebP images are allowed")

    contents = await image.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="Image must be under 5MB")

    ext = image.filename.rsplit(".", 1)[-1].lower()
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    result = await add_portfolio_item(current_user["_id"], filename, description)
    if result == "not_found":
        raise HTTPException(status_code=404, detail="Provider profile not found")

    return {"message": "Portfolio item added", "item_id": result, "image_path": filename}


@router.get("/{provider_user_id}")
async def get_items(provider_user_id: str):
    items = await get_portfolio(provider_user_id)
    return items


@router.delete("/{item_id}")
async def delete_item(item_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "provider":
        raise HTTPException(status_code=403, detail="Only providers can delete portfolio items")

    result = await delete_portfolio_item(item_id, current_user["_id"])
    if result == "not_found":
        raise HTTPException(status_code=404, detail="Item not found")
    if result == "forbidden":
        raise HTTPException(status_code=403, detail="This item does not belong to you")
    return {"message": "Item deleted"}
