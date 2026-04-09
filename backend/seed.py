"""
Khadamni — Test Data Seed Script
Run from the backend/ directory:  python seed.py

All accounts use email @test.com → bypass OTP + password check on login.
Just type any password (e.g. test123) on the login form.

Idempotent: wipes all @test.com data before re-seeding.
"""

import asyncio
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from app.utils.security import hash_password

# ── Tunis neighborhood coordinates ───────────────────────────────────────────
LOCATIONS = {
    "Centre Ville":  {"lat": 36.8065, "lng": 10.1815},
    "La Marsa":      {"lat": 36.8776, "lng": 10.3250},
    "Ariana":        {"lat": 36.8625, "lng": 10.1956},
    "El Menzah":     {"lat": 36.8414, "lng": 10.1711},
    "Carthage":      {"lat": 36.8528, "lng": 10.3233},
    "Sidi Bou Said": {"lat": 36.8702, "lng": 10.3417},
    "Ezzahra":       {"lat": 36.7339, "lng": 10.2264},
    "Bardo":         {"lat": 36.8092, "lng": 10.1500},
}

PW = hash_password("test123")
NOW = datetime.now(timezone.utc)


def geo(lat, lng):
    return {"type": "Point", "coordinates": [lng, lat]}


async def seed():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]

    # ── Ensure geospatial index ───────────────────────────────────────────────
    await db.provider_profiles.create_index([("location", "2dsphere")])

    # ── Wipe existing test data (idempotent) ──────────────────────────────────
    print("Wiping existing @test.com data...")
    test_users = await db.users.find({"email": {"$regex": "@test\\.com$"}}, {"_id": 1}).to_list(None)
    test_ids = [u["_id"] for u in test_users]

    if test_ids:
        await db.users.delete_many({"_id": {"$in": test_ids}})
        await db.provider_profiles.delete_many({"user_id": {"$in": test_ids}})
        await db.service_requests.delete_many({
            "$or": [{"client_id": {"$in": test_ids}}, {"provider_id": {"$in": test_ids}}]
        })
        await db.ratings.delete_many({
            "$or": [{"rated_id": {"$in": test_ids}}, {"rater_id": {"$in": test_ids}}]
        })
        await db.portfolio.delete_many({"user_id": {"$in": test_ids}})
        await db.device_tokens.delete_many({"email": {"$regex": "@test\\.com$"}})
        await db.otp_codes.delete_many({"email": {"$regex": "@test\\.com$"}})
    print("Done wiping.\n")

    # ─────────────────────────────────────────────────────────────────────────
    # USERS
    # ─────────────────────────────────────────────────────────────────────────

    # Moderator
    mod = await db.users.insert_one({
        "first_name": "Karim", "last_name": "Moderateur",
        "email": "mod@test.com", "phone": "+21620000000",
        "password": PW, "role": "moderator",
        "suspended": False,
    })

    # Clients
    client_emails = ["client1@test.com", "client2@test.com", "client3@test.com"]
    client_names  = [("Youssef", "Ben Ali"), ("Mariem", "Trabelsi"), ("Amine", "Chaabane")]
    client_ids = []
    for email, (fn, ln) in zip(client_emails, client_names):
        r = await db.users.insert_one({
            "first_name": fn, "last_name": ln,
            "email": email, "phone": "+21621000000",
            "password": PW, "role": "client",
            "suspended": False,
        })
        client_ids.append(r.inserted_id)

    # ── In-place providers ────────────────────────────────────────────────────
    inplace_specs = [
        ("provider1@test.com", "Hedi",    "Mansour",   "Plumbing",   ["Plumbing"],              "Centre Ville",  2800, "8"),
        ("provider2@test.com", "Nabil",   "Gharbi",    "Electrical", ["Electrical"],             "La Marsa",      3200, "5"),
        ("provider3@test.com", "Sarra",   "Belhaj",    "Cleaning",   ["Cleaning"],               "Ariana",        1800, "3"),
        ("provider4@test.com", "Mourad",  "Jelassi",   "Painting",   ["Painting"],               "El Menzah",     2200, "7"),
        ("provider5@test.com", "Bilel",   "Sfar",      "Carpentry",  ["Carpentry"],              "Carthage",      2600, "10"),
        ("provider6@test.com", "Nesrine", "Hamdi",     "Gardening",  ["Gardening", "Cleaning"],  "Sidi Bou Said", 1500, "4"),
        ("provider7@test.com", "Walid",   "Kchaou",    "Moving",     ["Moving"],                 "Ezzahra",       3500, "6"),
        ("provider8@test.com", "Tarek",   "Oueslati",  "Both",       ["Plumbing", "Electrical"], "Bardo",         3000, "9"),
    ]

    inplace_ids = []
    for email, fn, ln, bio_label, cats, neighborhood, rate, exp in inplace_specs:
        loc = LOCATIONS[neighborhood]
        r = await db.users.insert_one({
            "first_name": fn, "last_name": ln,
            "email": email, "phone": "+21622000000",
            "password": PW, "role": "provider",
            "suspended": False,
            "latitude": loc["lat"], "longitude": loc["lng"],
        })
        uid = r.inserted_id
        inplace_ids.append(uid)
        await db.provider_profiles.insert_one({
            "user_id": uid,
            "full_name": f"{fn} {ln}",
            "bio": f"Professionnel en {bio_label} basé à {neighborhood}, Tunis. Service rapide et soigné.",
            "service_categories": cats,
            "custom_category": None,
            "hourly_rate": rate,
            "experience_years": exp,
            "phone": "+21622000000",
            "rating_avg": 0, "rating_count": 0, "total_jobs": 0,
            "is_available": True,
            "job_type": "in_place",
            "latitude": loc["lat"], "longitude": loc["lng"],
            "location": geo(loc["lat"], loc["lng"]),
        })

    # ── Remote providers ──────────────────────────────────────────────────────
    remote_specs = [
        ("provider9@test.com",  "Aziz",    "Meddeb",   ["IT Support"],                    None,            2500, "6"),
        ("provider10@test.com", "Rania",   "Karray",   ["Tutoring", "Graphic Design"],     None,            1800, "3"),
        ("provider11@test.com", "Malek",   "Amara",    ["Web Development"],               None,            4000, "8"),
        ("provider12@test.com", "Fatma",   "Rezgui",   ["Translation", "Other"],           "Darija / French / English interpreter", 2000, "5"),
    ]

    remote_ids = []
    for email, fn, ln, cats, custom_cat, rate, exp in remote_specs:
        r = await db.users.insert_one({
            "first_name": fn, "last_name": ln,
            "email": email, "phone": "+21623000000",
            "password": PW, "role": "provider",
            "suspended": False,
        })
        uid = r.inserted_id
        remote_ids.append(uid)
        await db.provider_profiles.insert_one({
            "user_id": uid,
            "full_name": f"{fn} {ln}",
            "bio": f"Prestataire remote basé à Tunis. Disponible pour missions en ligne.",
            "service_categories": cats,
            "custom_category": custom_cat,
            "hourly_rate": rate,
            "experience_years": exp,
            "phone": "+21623000000",
            "rating_avg": 0, "rating_count": 0, "total_jobs": 0,
            "is_available": True,
            "job_type": "remote",
            "latitude": None, "longitude": None,
        })

    print(f"Created: 1 moderator, {len(client_ids)} clients, {len(inplace_ids)} in-place providers, {len(remote_ids)} remote providers")

    # ─────────────────────────────────────────────────────────────────────────
    # COMPLETED SERVICE REQUESTS
    # ─────────────────────────────────────────────────────────────────────────
    # These populate the moderator dashboard stats (top categories, request counts)

    completed_requests = [
        # (client_idx, provider_id, category, job_type, description, agreed_price, days_ago)
        (0, inplace_ids[0], "Plumbing",    "in_place", "Fuite d'eau salle de bain", 150, 10),
        (1, inplace_ids[1], "Electrical",  "in_place", "Installation prise électrique", 200, 8),
        (2, inplace_ids[2], "Cleaning",    "in_place", "Nettoyage appartement 3 pièces", 120, 7),
        (0, inplace_ids[3], "Painting",    "in_place", "Peinture chambre 20m²", 350, 6),
        (1, inplace_ids[4], "Carpentry",   "in_place", "Réparation meuble en bois", 180, 5),
        (2, inplace_ids[0], "Plumbing",    "in_place", "Débouchage évier cuisine", 100, 4),
        (0, remote_ids[0],  "IT Support",  "remote",   "Configuration réseau à distance", 250, 3),
        (1, remote_ids[2],  "Web Development", "remote", "Landing page pour restaurant", 800, 2),
    ]

    request_ids = []
    for c_idx, p_id, category, jtype, desc, price, days_ago in completed_requests:
        completed_at = NOW - timedelta(days=days_ago)
        r = await db.service_requests.insert_one({
            "client_id": client_ids[c_idx],
            "provider_id": p_id,
            "description": desc,
            "service_category": category,
            "job_type": jtype,
            "status": "completed",
            "agreed_price": price,
            "created_at": completed_at - timedelta(hours=3),
            "updated_at": completed_at,
            "completed_at": completed_at,
        })
        request_ids.append(r.inserted_id)

    print(f"Created {len(request_ids)} completed requests")

    # Update provider total_jobs counts
    from collections import Counter
    job_counts = Counter()
    for _, p_id, *_ in completed_requests:
        job_counts[p_id] += 1
    for p_id, count in job_counts.items():
        await db.provider_profiles.update_one(
            {"user_id": p_id}, {"$set": {"total_jobs": count}}
        )

    # ─────────────────────────────────────────────────────────────────────────
    # RATINGS
    # ─────────────────────────────────────────────────────────────────────────

    ratings_data = [
        # (rater=client_idx, rated=provider, request_idx, score, comment)
        (0, inplace_ids[0], 0, 5, "Excellent travail, très rapide et propre !"),
        (1, inplace_ids[1], 1, 4, "Bon électricien, ponctuel."),
        (2, inplace_ids[2], 2, 5, "Appartement impeccable, très satisfaite."),
        (0, inplace_ids[3], 3, 4, "Belle peinture, bon rapport qualité/prix."),
        (0, remote_ids[0],  6, 5, "Problème résolu en 30 minutes, très compétent."),
        (1, remote_ids[2],  7, 5, "Site livré à temps, design moderne."),
    ]

    for c_idx, p_id, req_idx, score, comment in ratings_data:
        await db.ratings.insert_one({
            "rater_id": client_ids[c_idx],
            "rated_id": p_id,
            "job_id": request_ids[req_idx],
            "score": score,
            "comment": comment,
            "created_at": NOW - timedelta(days=1),
        })

    # Recompute rating_avg + rating_count for rated providers
    rated_provider_ids = list({p_id for _, p_id, *_ in ratings_data})
    for p_id in rated_provider_ids:
        provider_ratings = await db.ratings.find({"rated_id": p_id}).to_list(None)
        avg = sum(r["score"] for r in provider_ratings) / len(provider_ratings)
        await db.provider_profiles.update_one(
            {"user_id": p_id},
            {"$set": {"rating_avg": round(avg, 2), "rating_count": len(provider_ratings)}}
        )

    print(f"Created {len(ratings_data)} ratings")

    # ─────────────────────────────────────────────────────────────────────────
    # DISPUTE REPORT (for moderator reports panel)
    # ─────────────────────────────────────────────────────────────────────────

    await db.reports.insert_one({
        "request_id": request_ids[3],
        "reporter_id": client_ids[0],
        "reporter_role": "client",
        "status": "pending",
        "ai_summary": (
            "Le client affirme que la peinture a été réalisée avec des matériaux de mauvaise qualité "
            "et que le résultat final ne correspond pas aux attentes convenues. "
            "Le prestataire soutient que les matériaux utilisés étaient conformes au devis initial."
        ),
        "recommendation": "client_favored",
        "ai_suggested_action": (
            "Rembourser 30% du montant convenu au client ou refaire la portion contestée."
        ),
        "moderator_note": None,
        "created_at": NOW - timedelta(days=1),
    })

    print("Created 1 dispute report")

    # ─────────────────────────────────────────────────────────────────────────
    # SUMMARY
    # ─────────────────────────────────────────────────────────────────────────
    print("\n" + "=" * 55)
    print("  SEED COMPLETE — Login with any of these accounts:")
    print("=" * 55)
    print(f"  {'Role':<18} {'Email':<28} Password")
    print(f"  {'-'*18} {'-'*28} --------")
    all_accounts = [
        ("Moderator",        "mod@test.com"),
        ("Client",           "client1@test.com"),
        ("Client",           "client2@test.com"),
        ("Client",           "client3@test.com"),
        ("Provider (place)", "provider1@test.com"),
        ("Provider (place)", "provider2@test.com"),
        ("Provider (place)", "provider3@test.com"),
        ("Provider (place)", "provider4@test.com"),
        ("Provider (place)", "provider5@test.com"),
        ("Provider (place)", "provider6@test.com"),
        ("Provider (place)", "provider7@test.com"),
        ("Provider (place)", "provider8@test.com"),
        ("Provider (remote)","provider9@test.com"),
        ("Provider (remote)","provider10@test.com"),
        ("Provider (remote)","provider11@test.com"),
        ("Provider (remote)","provider12@test.com"),
    ]
    for role, email in all_accounts:
        print(f"  {role:<18} {email:<28} test123 (any password works)")
    print("=" * 55)

    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
