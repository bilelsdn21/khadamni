
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import connect_db, close_db
from app.routers.auth import router as auth_router



@asynccontextmanager
async def lifespan(app):
    await connect_db()
    yield
    await close_db()

# 3. Create a "lifespan" async context manager that:
#      - Calls connect_db() on startup
#      - Calls close_db() on shutdown
# 4. Create the FastAPI app instance with title="Khadamni API"
app = FastAPI(title="Khadamni API", lifespan=lifespan)

# 5. Add CORS middleware allowing frontend origin (http://localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
app.include_router(auth_router)

