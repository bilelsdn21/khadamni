from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from bson import ObjectId

from app.dependencies import get_current_user
from app.database import get_db
from app.services.ai_service import analyze_request, get_category_price_stats, analyze_dispute

router = APIRouter(prefix="/api/ai", tags=["AI"])


class RequestAnalysisBody(BaseModel):
    description: str


class DisputeReportBody(BaseModel):
    request_id: str
    reason: str


@router.post("/analyze-request")
async def ai_analyze_request(
    body: RequestAnalysisBody,
    _=Depends(get_current_user),
):
    """
    Claude reads a client's description (any language / Tunisian dialect) and returns
    a structured request: category, urgency, French description, price range, key points.
    """
    try:
        return await analyze_request(body.description)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI unavailable: {str(e)}")


@router.get("/price-stats/{category}")
async def category_price_stats(
    category: str,
    _=Depends(get_current_user),
):
    """
    Returns real price range derived from past confirmed/completed jobs on the platform.
    No AI is involved — pure MongoDB aggregate on chat_rooms.agreed_price.
    Returns { available: false } when fewer than 3 data points exist.
    """
    stats = await get_category_price_stats(category)
    if not stats:
        return {"available": False}
    return {"available": True, **stats}


@router.post("/report")
async def ai_report(
    body: DisputeReportBody,
    current_user: dict = Depends(get_current_user),
):
    """
    Claude reads the full chat history for a job and produces a dispute analysis
    with timeline, evidence, recommendation, and suggested action for a moderator.
    The report is persisted in the `reports` collection.
    """
    if current_user.get("role") == "moderator":
        raise HTTPException(status_code=403, detail="Moderators cannot submit reports")

    db = get_db()

    try:
        req = await db.service_requests.find_one({"_id": ObjectId(body.request_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request ID")

    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    # Ensure the reporter is a party to this job
    reporter_id = str(current_user["_id"])
    if str(req["client_id"]) != reporter_id and str(req["provider_id"]) != reporter_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    reporter_role = "client" if str(req["client_id"]) == reporter_id else "provider"

    # Fetch chat messages with sender role resolved
    room = await db.chat_rooms.find_one({"request_id": ObjectId(body.request_id)})
    messages = []
    if room:
        async for m in db.chat_messages.find(
            {"room_id": room["_id"]}
        ).sort("timestamp", 1):
            role = "client" if m["sender_id"] == req["client_id"] else "provider"
            messages.append({
                "sender_role": role,
                "message": m.get("message", ""),
                "message_type": m.get("message_type", "text"),
            })

    req_info = {
        "description": req.get("description", ""),
        "status": req.get("status", ""),
        "job_type": req.get("job_type", ""),
    }

    try:
        analysis = await analyze_dispute(req_info, messages, reporter_role, body.reason)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI unavailable: {str(e)}")

    # Persist the report for moderator review
    await db.reports.insert_one({
        "request_id": ObjectId(body.request_id),
        "reporter_id": ObjectId(reporter_id),
        "reporter_role": reporter_role,
        "reason": body.reason,
        "ai_analysis": analysis,
        "status": "pending",
    })

    return analysis
