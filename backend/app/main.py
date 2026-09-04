
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database import connect_db, close_db
from app.services import storage
from app.routers.auth import router as auth_router
from app.routers.providers import router as provider_router
from app.routers.requests import router as request_router
from app.routers.ratings import router as ratings_router
from app.routers.profile import router as profile_router
from app.routers.portfolio import router as portfolio_router
from app.routers.chat import router as chat_router
from app.routers.ai import router as ai_router
from app.routers.moderator import router as moderator_router


BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = Path(settings.STATIC_DIR) if settings.STATIC_DIR else BASE_DIR / "static"


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
# In production the frontend is served by this app, so same-origin requests
# need no CORS at all; CORS_ORIGINS covers any extra deployed frontend.
allowed_origins = ["http://localhost:5173", "http://localhost:8000"]
allowed_origins += [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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
app.include_router(chat_router)
app.include_router(ai_router)
app.include_router(moderator_router)


@app.get("/uploads/{filename}")
async def serve_upload(filename: str):
    """Uploaded images. Redirects to Supabase Storage in production,
    reads from backend/uploads when running locally."""
    if "/" in filename or "\\" in filename or filename.startswith("."):
        raise HTTPException(status_code=404, detail="Not found")

    remote = storage.public_url(filename)
    if remote:
        return RedirectResponse(remote, status_code=307)

    path = storage.LOCAL_UPLOAD_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(path)


# ── Frontend ────────────────────────────────────────────────────────────────
# Serve the built React app when it is present, so the API and the UI share a
# single origin. Without a build, only the API runs and Vite serves the UI.
if STATIC_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Unknown API paths must stay 404s, not fall through to index.html.
        if full_path.startswith(("api/", "uploads/")):
            raise HTTPException(status_code=404, detail="Not found")

        candidate = (STATIC_DIR / full_path).resolve()
        if (
            full_path
            and STATIC_DIR.resolve() in candidate.parents
            and candidate.is_file()
        ):
            return FileResponse(candidate)
        return FileResponse(STATIC_DIR / "index.html")
