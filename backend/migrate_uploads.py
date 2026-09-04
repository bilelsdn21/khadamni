"""One-shot: copy backend/uploads/* into the Supabase bucket.

Existing avatars and portfolio images are referenced by filename in Mongo, so
they keep working online once the files live in the bucket. Run once, locally,
with SUPABASE_URL and SUPABASE_SERVICE_KEY set in backend/.env:

    python migrate_uploads.py
"""
import asyncio
import mimetypes

from app.services import storage


async def main():
    if not storage.is_remote():
        print("SUPABASE_URL / SUPABASE_SERVICE_KEY not set — nothing to do.")
        print("Fill them in backend/.env first.")
        return

    files = sorted(p for p in storage.LOCAL_UPLOAD_DIR.glob("*") if p.is_file())
    if not files:
        print(f"No files in {storage.LOCAL_UPLOAD_DIR}")
        return

    print(f"Uploading {len(files)} file(s) to bucket '{storage.settings.SUPABASE_BUCKET}'\n")
    for path in files:
        content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        try:
            await storage.save_file(path.read_bytes(), path.name, content_type)
            print(f"  ok    {path.name}")
        except Exception as exc:
            print(f"  FAIL  {path.name}: {exc}")

    print("\nDone. Verify one at:")
    print(f"  {storage.public_url(files[0].name)}")


if __name__ == "__main__":
    asyncio.run(main())
