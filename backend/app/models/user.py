from pydantic import BaseModel, EmailStr
from typing import Optional, List

class UserCreate(BaseModel):
    # Required for everyone
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    role: str                                    # "client" or "provider"
    phone: Optional[str] = None

    # Required only for providers (optional for clients)
    bio: Optional[str] = None                    # about me
    service_categories: Optional[List[str]] = None   # ["plumbing", "electrical"]
    hourly_rate: Optional[float] = None          # price per hour
    experience_years: Optional[int] = None       # years of experience
    avatar: Optional[str] = None                 # profile image URL
