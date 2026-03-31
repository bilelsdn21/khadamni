from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class RatingCreate(BaseModel):
    job_id: str
    score: int          # 1 to 5
    comment: Optional[str] = None


class RatingResponse(BaseModel):
    id: str
    job_id: str
    rater_id: str
    rated_id: str
    score: int
    comment: Optional[str]
    created_at: datetime
