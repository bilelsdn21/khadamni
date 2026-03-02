# rating.py — Rating & Review Pydantic Schemas
#
# What to build here:
#
# 1. RatingCreate — submit a rating after job completion
#      Fields: job_id, rated_user_id, score (1-5), comment (optional)
#
# 2. RatingResponse — data returned to frontend
#      Fields: id, job_id, rater_id, rated_user_id, score, comment, created_at
#
# 3. RatingSummary — aggregated stats for a user
#      Fields: user_id, average_score, total_ratings, score_distribution (dict)
#
# 4. RatingList — paginated list
#      Fields: items (list), total, page, per_page
