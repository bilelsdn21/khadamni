from pydantic import BaseModel,EmailStr
from typing import Optional

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    role: str            
    avatar: Optional[str] = None 