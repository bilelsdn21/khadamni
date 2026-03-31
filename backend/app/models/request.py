from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ServiceRequestCreate(BaseModel):
    provider_id: str       # provider_profiles._id (sent from frontend)
    description: str


class ServiceRequestResponse(BaseModel):
    id: str
    client_id: str
    provider_id: str
    provider_profile_id: Optional[str]
    client_name: str
    provider_name: str
    description: str
    status: str            # pending | in_progress | completed | rejected | cancelled
    created_at: datetime
    updated_at: datetime
