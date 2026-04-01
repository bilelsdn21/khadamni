from pydantic import BaseModel, EmailStr
from typing import Optional, List

class UserCreate(BaseModel):
    # Required for everyone
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    role: str
    phone: str = None
    latitude: float= None
    longitude: float = None

    # Required only for providers (optional for clients)
    bio: Optional[str] = None
    service_categories: Optional[List[str]] = None
    hourly_rate: Optional[float] = None
    experience_years: Optional[str] = None
    avatar: Optional[str] = None
class UserLogin(BaseModel):
    email: str
    password: str
    remember_me: bool = False
    device_token: Optional[str] = None

class OTPVerify(BaseModel):
    email: str
    code: str
    remember_me: bool = False
