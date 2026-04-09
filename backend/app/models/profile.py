from pydantic import BaseModel
from typing import Optional, List


class ClientProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    avatar: Optional[str] = None


class ProviderProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    service_categories: Optional[List[str]] = None
    custom_category: Optional[str] = None
    hourly_rate: Optional[float] = None
    experience_years: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    avatar: Optional[str] = None
    is_available: Optional[bool] = None
