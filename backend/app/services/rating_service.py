from app.database import get_db
from datetime import datetime, timezone
from bson import ObjectId


async def submit_rating(rater_id: str, rater_role: str, data):
    db = get_db()

    # 1. Fetch the job
    request = await db.service_requests.find_one({"_id": ObjectId(data.job_id)})
    if not request:
        return "not_found"

    # 2. Job must be completed
    if request["status"] != "completed":
        return "not_completed"

    # 3. Caller must be a participant of this job
    if rater_role == "client":
        if str(request["client_id"]) != rater_id:
            return "forbidden"
    else:
        if str(request["provider_id"]) != rater_id:
            return "forbidden"

    # 4. No duplicate rating for same job + same rater
    existing = await db.ratings.find_one({
        "job_id": ObjectId(data.job_id),
        "rater_id": ObjectId(rater_id)
    })
    if existing:
        return "already_rated"

    # 5. Determine who gets rated
    if rater_role == "client":
        rated_id = request["provider_id"]   # client rates the provider
    else:
        rated_id = request["client_id"]     # provider rates the client

    # 6. Save the rating
    await db.ratings.insert_one({
        "job_id": ObjectId(data.job_id),
        "rater_id": ObjectId(rater_id),
        "rated_id": rated_id,
        "score": data.score,
        "comment": data.comment,
        "created_at": datetime.now(timezone.utc)
    })

    # 7. Update the rated person's average
    if rater_role == "client":
        # Provider was rated → update provider_profiles
        profile = await db.provider_profiles.find_one({"user_id": rated_id})
        old_avg = profile["rating_avg"]
        old_count = profile["rating_count"]
        new_count = old_count + 1
        new_avg = (old_avg * old_count + data.score) / new_count
        await db.provider_profiles.update_one(
            {"user_id": rated_id},
            {"$set": {"rating_avg": new_avg}, "$inc": {"rating_count": 1}}
        )
    else:
        # Client was rated → update users
        user = await db.users.find_one({"_id": rated_id})
        old_avg = user.get("rating_avg", 0)
        old_count = user.get("rating_count", 0)
        new_count = old_count + 1
        new_avg = (old_avg * old_count + data.score) / new_count
        await db.users.update_one(
            {"_id": rated_id},
            {"$set": {"rating_avg": new_avg}, "$inc": {"rating_count": 1}}
        )

    return "ok"


async def get_user_ratings(user_id: str):
    db = get_db()
    ratings = await db.ratings.find(
        {"rated_id": ObjectId(user_id)}
    ).sort("created_at", -1).to_list(length=50)

    for r in ratings:
        r["_id"] = str(r["_id"])
        r["job_id"] = str(r["job_id"])
        r["rater_id"] = str(r["rater_id"])
        r["rated_id"] = str(r["rated_id"])

    return ratings


async def get_job_ratings(job_id: str, user_id: str):
    db = get_db()

    # Verify caller is a participant
    request = await db.service_requests.find_one({"_id": ObjectId(job_id)})
    if not request:
        return "not_found"
    if str(request["client_id"]) != user_id and str(request["provider_id"]) != user_id:
        return "forbidden"

    ratings = await db.ratings.find({"job_id": ObjectId(job_id)}).to_list(length=2)

    for r in ratings:
        r["_id"] = str(r["_id"])
        r["job_id"] = str(r["job_id"])
        r["rater_id"] = str(r["rater_id"])
        r["rated_id"] = str(r["rated_id"])

    return ratings
