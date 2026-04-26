from fastapi import WebSocket
from jose import jwt, JWTError
from app.config import settings
from app.database import get_db
from bson import ObjectId


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}
        self.connection_users: dict[str, set[str]] = {}  # request_id -> set of user_ids

    async def connect(self, request_id: str, websocket: WebSocket, user_id: str = None):
        await websocket.accept()
        if request_id not in self.active_connections:
            self.active_connections[request_id] = []
        self.active_connections[request_id].append(websocket)
        if user_id:
            if request_id not in self.connection_users:
                self.connection_users[request_id] = set()
            self.connection_users[request_id].add(user_id)

    def disconnect(self, request_id: str, websocket: WebSocket, user_id: str = None):
        if request_id in self.active_connections:
            try:
                self.active_connections[request_id].remove(websocket)
            except ValueError:
                pass
            if not self.active_connections[request_id]:
                del self.active_connections[request_id]
        if user_id and request_id in self.connection_users:
            self.connection_users[request_id].discard(user_id)
            if not self.connection_users[request_id]:
                del self.connection_users[request_id]

    def get_online_users(self, request_id: str) -> list:
        return list(self.connection_users.get(request_id, set()))

    async def broadcast(self, request_id: str, message: dict):
        if request_id in self.active_connections:
            for connection in self.active_connections[request_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass

    async def send_to(self, websocket: WebSocket, message: dict):
        try:
            await websocket.send_json(message)
        except:
            pass

    async def broadcast_except(self, request_id: str, message: dict, exclude_ws: WebSocket):
        if request_id in self.active_connections:
            for connection in self.active_connections[request_id]:
                if connection is not exclude_ws:
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
