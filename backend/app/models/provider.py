from pydantic import BaseModel
from typing import Optional, List

class ProviderCreate(BaseModel):
    bio: str                          # description about themselves
    service_categories: List[str]     # ["plumbing", "electrical", "cleaning"]
    hourly_rate: Optional[float] = None