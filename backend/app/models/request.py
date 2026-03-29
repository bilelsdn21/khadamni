from pydantic import BaseModel

class ServiceRequestCreate(BaseModel):
    provider_id: str
    description: str
