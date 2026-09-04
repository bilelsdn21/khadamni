"""File storage — Supabase Storage in production, local disk in development.

Both backends store and return a bare filename, which is what the database
holds and what the frontend requests as /uploads/<filename>. Switching
backends therefore needs no data migration and no frontend change.

Supabase is used when SUPABASE_URL and SUPABASE_SERVICE_KEY are set;
otherwise files stay on local disk under backend/uploads.
"""
import os
from pathlib import Path

import httpx
from fastapi import HTTPException

from app.config import settings

LOCAL_UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"


def is_remote() -> bool:
    return bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY)


def _object_url(filename: str) -> str:
    base = settings.SUPABASE_URL.rstrip("/")
    return f"{base}/storage/v1/object/{settings.SUPABASE_BUCKET}/{filename}"


def public_url(filename: str) -> str | None:
    """Public URL for a stored file, or None when files are served locally."""
    if not is_remote():
        return None
    base = settings.SUPABASE_URL.rstrip("/")
    return f"{base}/storage/v1/object/public/{settings.SUPABASE_BUCKET}/{filename}"


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
        "apikey": settings.SUPABASE_SERVICE_KEY,
    }


async def save_file(contents: bytes, filename: str, content_type: str) -> str:
    """Store bytes under `filename`. Returns the filename to persist in Mongo."""
    if not is_remote():
        LOCAL_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        (LOCAL_UPLOAD_DIR / filename).write_bytes(contents)
        return filename

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            _object_url(filename),
            content=contents,
            headers={
                **_headers(),
                "Content-Type": content_type or "application/octet-stream",
                "x-upsert": "true",
            },
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"Upload failed: {response.text}")
    return filename


async def delete_file(filename: str) -> None:
    """Best-effort delete. A missing file is not an error."""
    if not filename:
        return

    if not is_remote():
        path = LOCAL_UPLOAD_DIR / filename
        if path.is_file():
            os.remove(path)
        return

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            await client.delete(_object_url(filename), headers=_headers())
    except httpx.HTTPError:
        pass
