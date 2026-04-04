from fastapi import WebSocket
from jose import jwt, JWTError
from app.config import settings
from app.database import get_db
from bson import ObjectId


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, request_id: str, websocket: WebSocket):
        await websocket.accept()
        if request_id not in self.active_connections:
            self.active_connections[request_id] = []
        self.active_connections[request_id].append(websocket)

    def disconnect(self, request_id: str, websocket: WebSocket):
        if request_id in self.active_connections:
            self.active_connections[request_id].remove(websocket)
            if not self.active_connections[request_id]:
                del self.active_connections[request_id]

    async def broadcast(self, request_id: str, message: dict):
        if request_id in self.active_connections:
            for connection in self.active_connections[request_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass

    def get_connection_count(self, request_id: str) -> int:
        return len(self.active_connections.get(request_id, []))


manager = ConnectionManager()


async def get_user_from_token(token: str):
    """Validate JWT token and return user dict, or None if invalid."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
    except JWTError:
        return None

    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return None

    user["_id"] = str(user["_id"])
    return user
