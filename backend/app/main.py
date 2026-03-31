
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import connect_db, close_db
from app.routers.auth import router as auth_router
from app.routers.providers import router as provider_router
from app.routers.requests import router as request_router
from app.routers.ratings import router as ratings_router
from app.routers.profile import router as profile_router
from app.routers.portfolio import router as portfolio_router



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
app.include_router(provider_router)
app.include_router(request_router)
app.include_router(ratings_router)
app.include_router(profile_router)
app.include_router(portfolio_router)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
