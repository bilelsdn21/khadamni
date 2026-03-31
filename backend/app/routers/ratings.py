from fastapi import APIRouter, HTTPException, Depends
from app.models.rating import RatingCreate
from app.services.rating_service import submit_rating, get_user_ratings, get_job_ratings
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/ratings", tags=["Ratings"])


def _map_error(result: str):
    if result == "not_found":
        raise HTTPException(status_code=404, detail="Job not found")
    if result == "forbidden":
        raise HTTPException(status_code=403, detail="You are not authorized to perform this action")
    if result == "not_completed":
        raise HTTPException(status_code=400, detail="Job must be completed before rating")
    if result == "already_rated":
        raise HTTPException(status_code=400, detail="You have already rated this job")


@router.post("/")
async def submit(data: RatingCreate, current_user: dict = Depends(get_current_user)):
    result = await submit_rating(current_user["_id"], current_user["role"], data)
    if result != "ok":
        _map_error(result)
    return {"message": "Rating submitted"}


@router.get("/user/{user_id}")
async def user_ratings(user_id: str):
    ratings = await get_user_ratings(user_id)
    return ratings


@router.get("/job/{job_id}")
async def job_ratings(job_id: str, current_user: dict = Depends(get_current_user)):
    result = await get_job_ratings(job_id, current_user["_id"])
    if isinstance(result, str):
        _map_error(result)
    return result
