from fastapi import APIRouter, HTTPException, Depends
from app.models.request import ServiceRequestCreate
from app.services.request_service import create_request, get_my_requests, accept_request, reject_request
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/requests", tags=["Requests"])


@router.post("/")
async def create(data: ServiceRequestCreate, current_user: dict = Depends(get_current_user)):
    request_id = await create_request(current_user["_id"], data.provider_id, data.description)
    return {"message": "Request sent", "request_id": request_id}


@router.get("/my")
async def my_requests(current_user: dict = Depends(get_current_user)):
    requests = await get_my_requests(current_user["_id"], current_user["role"])
    return requests


@router.post("/{request_id}/accept")
async def accept(request_id: str, current_user: dict = Depends(get_current_user)):
    await accept_request(request_id)
    return {"message": "Request accepted"}


@router.post("/{request_id}/reject")
async def reject(request_id: str, current_user: dict = Depends(get_current_user)):
    await reject_request(request_id)
    return {"message": "Request rejected"}
