# rating_service.py — Rating Business Logic
#
# Functions to build:
#
# 1. submit_rating(rater_id, data) — Save rating, update provider's average
# 2. get_user_ratings(user_id, page) — Paginated ratings for a user
# 3. get_rating_summary(user_id) — Calculate average, total, distribution
# 4. get_job_ratings(job_id) — Get both ratings for a job
#
# Important: use MongoDB atomic operations ($inc, $set) to update averages
