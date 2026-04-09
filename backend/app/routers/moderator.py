from fastapi import APIRouter, HTTPException, Depends, Query
from app.dependencies import get_current_user
from app.database import get_db
from bson import ObjectId
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
from app.utils.email import send_suspension_email
import math

router = APIRouter(prefix="/api/moderator", tags=["Moderator"])


def require_moderator(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "moderator":
        raise HTTPException(status_code=403, detail="Moderator access required")
    return current_user


class SuspendBody(BaseModel):
    reason: str
    duration: str  # "1d", "3d", "1w", "1m", "permanent"


class EditUserBody(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None


class ReviewReportBody(BaseModel):
    moderator_note: Optional[str] = None


def duration_to_datetime(duration: str) -> Optional[datetime]:
    mapping = {"1d": timedelta(days=1), "3d": timedelta(days=3), "1w": timedelta(weeks=1), "1m": timedelta(days=30)}
    if duration == "permanent":
        return None
    delta = mapping.get(duration)
    if not delta:
        raise HTTPException(status_code=400, detail=f"Invalid duration: {duration}")
    return datetime.now(timezone.utc) + delta


# ─── Stats ───────────────────────────────────────────────────────────────────

@router.get("/stats")
async def get_stats(_: dict = Depends(require_moderator)):
    db = get_db()

    total_users = await db.users.count_documents({})
    clients = await db.users.count_documents({"role": "client"})
    providers = await db.users.count_documents({"role": "provider"})
    suspended = await db.users.count_documents({"suspended": True})

    total_requests = await db.service_requests.count_documents({})
    pending = await db.service_requests.count_documents({"status": "pending"})
    in_progress = await db.service_requests.count_documents({"status": "in_progress"})
    completed = await db.service_requests.count_documents({"status": "completed"})
    cancelled = await db.service_requests.count_documents({"status": "cancelled"})
    rejected = await db.service_requests.count_documents({"status": "rejected"})

    reports_pending = await db.reports.count_documents({"status": "pending"})
    reports_reviewed = await db.reports.count_documents({"status": "reviewed"})

    pipeline_inplace = [
        {"$match": {"status": "completed", "job_type": "in_place"}},
        {"$group": {"_id": "$service_category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 3},
        {"$project": {"category": "$_id", "count": 1, "_id": 0}},
    ]
    top_inplace = await db.service_requests.aggregate(pipeline_inplace).to_list(3)

    pipeline_remote = [
        {"$match": {"status": "completed", "job_type": "remote"}},
        {"$group": {"_id": "$service_category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 3},
        {"$project": {"category": "$_id", "count": 1, "_id": 0}},
    ]
    top_remote = await db.service_requests.aggregate(pipeline_remote).to_list(3)

    return {
        "users": {"total": total_users, "clients": clients, "providers": providers, "suspended": suspended},
        "requests": {
            "total": total_requests,
            "pending": pending,
            "in_progress": in_progress,
            "completed": completed,
            "cancelled": cancelled,
            "rejected": rejected,
        },
        "reports": {"pending": reports_pending, "reviewed": reports_reviewed},
        "top_inplace": top_inplace,
        "top_remote": top_remote,
    }


# ─── Users ───────────────────────────────────────────────────────────────────

@router.get("/users")
async def get_users(
    search: str = Query(""),
    role: str = Query("all"),
    suspended: str = Query("all"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    _: dict = Depends(require_moderator),
):
    db = get_db()
    query = {}

    if search:
        query["$or"] = [
            {"first_name": {"$regex": search, "$options": "i"}},
            {"last_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]
    if role != "all":
        query["role"] = role
    if suspended == "true":
        query["suspended"] = True
    elif suspended == "false":
        query["suspended"] = {"$ne": True}

    total = await db.users.count_documents(query)
    skip = (page - 1) * per_page
    users = await db.users.find(query, {"password": 0}).skip(skip).limit(per_page).to_list(per_page)

    for u in users:
        u["_id"] = str(u["_id"])
        if u.get("suspended_until"):
            u["suspended_until"] = u["suspended_until"].isoformat()

    pages = math.ceil(total / per_page) if total > 0 else 1
    return {"users": users, "total": total, "page": page, "pages": pages}


@router.patch("/users/{user_id}/suspend")
async def suspend_user(user_id: str, body: SuspendBody, _: dict = Depends(require_moderator)):
    db = get_db()
    until = duration_to_datetime(body.duration)
    oid = ObjectId(user_id)
    user = await db.users.find_one({"_id": oid}, {"email": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.users.update_one(
        {"_id": oid},
        {"$set": {"suspended": True, "suspended_reason": body.reason, "suspended_until": until}},
    )
    try:
        await send_suspension_email(user["email"], body.reason, until)
    except Exception:
        pass
    return {"ok": True}


@router.patch("/users/{user_id}/activate")
async def activate_user(user_id: str, _: dict = Depends(require_moderator)):
    db = get_db()
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"suspended": False, "suspended_until": None, "suspended_reason": None}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, _: dict = Depends(require_moderator)):
    db = get_db()
    oid = ObjectId(user_id)

    # Fetch before deletion so we have email for token cleanup
    user = await db.users.find_one({"_id": oid}, {"email": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    email = user["email"]

    # Find all request IDs involving this user (for report cleanup)
    user_requests = await db.service_requests.find(
        {"$or": [{"client_id": oid}, {"provider_id": oid}]}, {"_id": 1}
    ).to_list(length=None)
    request_ids = [r["_id"] for r in user_requests]

    # Cascade deletes
    await db.users.delete_one({"_id": oid})
    await db.provider_profiles.delete_one({"user_id": oid})
    await db.service_requests.delete_many({"$or": [{"client_id": oid}, {"provider_id": oid}]})
    await db.ratings.delete_many({"$or": [{"rated_id": oid}, {"rater_id": oid}]})
    await db.portfolio.delete_many({"user_id": oid})
    await db.device_tokens.delete_many({"email": email})
    await db.otp_codes.delete_many({"email": email})
    if request_ids:
        await db.reports.delete_many({"request_id": {"$in": request_ids}})
    await db.reports.delete_many({"reporter_id": oid})

    return {"ok": True}


@router.patch("/users/{user_id}")
async def edit_user(user_id: str, body: EditUserBody, _: dict = Depends(require_moderator)):
    db = get_db()
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True}


# ─── Reports ─────────────────────────────────────────────────────────────────

@router.get("/reports")
async def get_reports(
    status: str = Query("pending"),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    _: dict = Depends(require_moderator),
):
    db = get_db()
    query = {"status": status}
    total = await db.reports.count_documents(query)
    skip = (page - 1) * per_page
    reports = await db.reports.find(query).sort("created_at", -1).skip(skip).limit(per_page).to_list(per_page)

    for r in reports:
        r["_id"] = str(r["_id"])
        request_oid = r.get("request_id")
        reporter_oid = r.get("reporter_id")
        r["request_id"] = str(request_oid) if request_oid else ""
        r["reporter_id"] = str(reporter_oid) if reporter_oid else ""
        if r.get("created_at"):
            r["created_at"] = r["created_at"].isoformat()

        # Enrich: reporter info
        reporter = None
        if reporter_oid:
            reporter = await db.users.find_one({"_id": reporter_oid}, {"first_name": 1, "last_name": 1, "email": 1})
        r["reporter_name"] = f"{reporter['first_name']} {reporter['last_name']}" if reporter else "Unknown"
        r["reporter_email"] = reporter.get("email", "") if reporter else ""

        # Enrich: reported user (other party in the service request)
        r["reported_user_id"] = ""
        r["reported_user_name"] = "Unknown"
        r["reported_user_email"] = ""
        r["reported_user_role"] = ""
        if request_oid:
            req = await db.service_requests.find_one(
                {"_id": request_oid}, {"client_id": 1, "provider_id": 1}
            )
            if req and reporter_oid:
                reported_oid = req["provider_id"] if req["client_id"] == reporter_oid else req["client_id"]
                reported = await db.users.find_one(
                    {"_id": reported_oid}, {"first_name": 1, "last_name": 1, "email": 1, "role": 1}
                )
                if reported:
                    r["reported_user_id"] = str(reported_oid)
                    r["reported_user_name"] = f"{reported['first_name']} {reported['last_name']}"
                    r["reported_user_email"] = reported.get("email", "")
                    r["reported_user_role"] = reported.get("role", "")
                else:
                    r["reported_user_name"] = "Deleted user"

    pages = math.ceil(total / per_page) if total > 0 else 1
    return {"reports": reports, "total": total, "page": page, "pages": pages}


@router.patch("/reports/{report_id}/review")
async def review_report(report_id: str, body: ReviewReportBody, _: dict = Depends(require_moderator)):
    db = get_db()
    update: dict = {"status": "reviewed"}
    if body.moderator_note:
        update["moderator_note"] = body.moderator_note
    result = await db.reports.update_one({"_id": ObjectId(report_id)}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"ok": True}
