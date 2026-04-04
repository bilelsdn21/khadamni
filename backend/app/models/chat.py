from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class OfferCreate(BaseModel):
    amount: float
    note: Optional[str] = ""


class OfferUpdate(BaseModel):
    status: str  # accepted or negotiating


class MessageResponse(BaseModel):
    id: str
    room_id: str
    sender_id: str
    message: str
    message_type: str
    offer_amount: Optional[float] = None
    offer_note: Optional[str] = None
    offer_status: Optional[str] = None
    timestamp: datetime
    is_read: bool


class ChatRoomResponse(BaseModel):
    room: dict
    messages: list
    other_party_name: str
    other_party_id: str
    service_category: str
    request_status: str
