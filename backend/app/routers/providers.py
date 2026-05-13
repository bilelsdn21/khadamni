from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
import httpx
from app.services.provider_service import get_all_providers, get_remote_providers, toggle_availability, update_location, get_provider_by_id
from app.dependencies import get_current_user


router = APIRouter(prefix="/api/providers", tags=["Providers"])


NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

@router.get("/geocode")
async def geocode(q: str = Query(...)):
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(
                NOMINATIM_URL,
                params={"q": q, "format": "json", "limit": 5},
                headers={"User-Agent": "Khadamni/1.0 (service marketplace app)"}
            )
        return res.json()
    except Exception:
        raise HTTPException(status_code=503, detail="Geocoding service unavailable. Use your current location instead.")


@router.get("/all_providers")
async def all_providers(category: str = None, search: str = None, include_offline: bool = True, page: int = 1, per_page: int = 30):
    return await get_all_providers(category, search, not include_offline, page, per_page)


@router.get("/remote")
async def remote_providers(category: str = None, search: str = None):
    providers = await get_remote_providers(category, search)
    return providers


@router.get("/route")
async def get_route(slat: float = Query(...), slng: float = Query(...), elat: float = Query(...), elng: float = Query(...)):
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"https://router.project-osrm.org/route/v1/driving/{slng},{slat};{elng},{elat}",
            params={"overview": "full", "geometries": "geojson"},
            headers={"User-Agent": "Khadamni/1.0 (service marketplace app)"},
            timeout=10.0
        )
    return res.json()


@router.get("/{provider_id}")
async def get_provider(provider_id: str):
    provider = await get_provider_by_id(provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider


class LocationUpdate(BaseModel):
    latitude: float
    longitude: float

@router.put("/location")
async def set_location(data: LocationUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "provider":
        raise HTTPException(status_code=403, detail="Only providers can update their location")
    result = await update_location(current_user["_id"], data.latitude, data.longitude)
    if result == "not_found":
        raise HTTPException(status_code=404, detail="Provider profile not found")
    return {"message": "Location updated"}


@router.post("/toggle-availability")
async def toggle(current_user: dict = Depends(get_current_user)):
    new_status = await toggle_availability(current_user["_id"])
    return {"is_available": new_status}

        
        

# 2. GET  /me            — Get own provider profile (requires auth)
# 3. PUT  /me            — Update own provider profile (requires auth)
# 4. GET  /{provider_id} — Get public provider profile
# 5. GET  /              — List/search providers with filters and pagination
#
# Create the router:
#   router = APIRouter(prefix="/api/providers", tags=["Providers"])
