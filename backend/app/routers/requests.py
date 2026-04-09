from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from app.models.request import ServiceRequestCreate
from app.services.request_service import (
    create_request, get_my_requests, get_request_by_id,
    accept_request, reject_request, complete_request, cancel_request
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/requests", tags=["Requests"])


def _map_error(result: str):
    if result == "not_found":
        raise HTTPException(status_code=404, detail="Request not found")
    if result == "forbidden":
        raise HTTPException(status_code=403, detail="You are not authorized to perform this action")
    if result == "invalid_status":
        raise HTTPException(status_code=400, detail="This action cannot be performed on the current request status")
    if result == "provider_not_found":
        raise HTTPException(status_code=404, detail="Provider not found")


@router.post("/")
async def create(data: ServiceRequestCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "client":
        raise HTTPException(status_code=403, detail="Only clients can send service requests")

    result = await create_request(current_user["_id"], data.provider_id, data.description)
    if isinstance(result, str) and result != result.replace("_", ""):
        _map_error(result)

    return {"message": "Request sent", "request_id": result}


@router.get("/my")
async def my_requests(status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "moderator":
        raise HTTPException(status_code=403, detail="Moderators do not have service requests")
    requests = await get_my_requests(current_user["_id"], current_user["role"], status)
    return requests


@router.get("/{request_id}")
async def get_one(request_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "moderator":
        raise HTTPException(status_code=403, detail="Moderators cannot access service request details")
    result = await get_request_by_id(request_id, current_user["_id"])
    if isinstance(result, str):
        _map_error(result)
    return result


@router.post("/{request_id}/accept")
async def accept(request_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "provider":
        raise HTTPException(status_code=403, detail="Only providers can accept requests")

    result = await accept_request(request_id, current_user["_id"])
    if result != "ok":
        _map_error(result)
    return {"message": "Request accepted"}


@router.post("/{request_id}/reject")
async def reject(request_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "provider":
        raise HTTPException(status_code=403, detail="Only providers can reject requests")

    result = await reject_request(request_id, current_user["_id"])
    if result != "ok":
        _map_error(result)
    return {"message": "Request rejected"}


@router.post("/{request_id}/complete")
async def complete(request_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "provider":
        raise HTTPException(status_code=403, detail="Only providers can complete requests")

    result = await complete_request(request_id, current_user["_id"])
    if result != "ok":
        _map_error(result)
    return {"message": "Request completed"}


@router.post("/{request_id}/cancel")
async def cancel(request_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "client":
        raise HTTPException(status_code=403, detail="Only clients can cancel requests")

    result = await cancel_request(request_id, current_user["_id"])
    if result != "ok":
        _map_error(result)
    return {"message": "Request cancelled"}
