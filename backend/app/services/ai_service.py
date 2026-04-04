import json
from groq import AsyncGroq
from app.database import get_db
from app.config import settings

_client = None

def _get_client():
    global _client
    if _client is None:
        _client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    return _client

CATEGORIES = [
    "Plumbing", "Electrical", "Cleaning", "Painting", "Tutoring",
    "Delivery", "IT Support", "Carpentry", "Gardening", "Moving",
    "Cooking", "AC Repair", "Locksmith", "Other",
]


def _strip_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return text.strip()

async def _generate(prompt: str) -> str:
    client = _get_client()
    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        response_format={"type": "json_object"},
    )
    return response.choices[0].message.content


async def analyze_request(description: str) -> dict:
    prompt = f"""You are an AI assistant for Khadamni, a Tunisian home-services marketplace.
The user wrote their request in Tunisian dialect (a mix of Arabic, French, and invented local words).
Understand it fully and return ONLY a JSON object.

Request: "{description}"
Available categories: {', '.join(CATEGORIES)}

Return exactly this shape:
{{
  "category": "<best match from the list above>",
  "urgency": "low|medium|high",
  "structured_description": "<2-3 sentence professional description in French>",
  "price_min": <integer DT>,
  "price_max": <integer DT>,
  "key_points": ["<point1>", "<point2>"]
}}"""

    text = await _generate(prompt)
    return json.loads(_strip_fences(text))


async def get_category_price_stats(category: str) -> dict | None:
    db = get_db()
    pipeline = [
        {
            "$lookup": {
                "from": "service_requests",
                "localField": "request_id",
                "foreignField": "_id",
                "as": "req",
            }
        },
        {"$unwind": "$req"},
        {
            "$match": {
                "status": {"$in": ["confirmed", "completed"]},
                "req.service_category": category,
                "agreed_price": {"$gt": 0},
            }
        },
        {
            "$group": {
                "_id": None,
                "min":   {"$min": "$agreed_price"},
                "max":   {"$max": "$agreed_price"},
                "avg":   {"$avg": "$agreed_price"},
                "count": {"$sum": 1},
            }
        },
    ]
    result = await db.chat_rooms.aggregate(pipeline).to_list(1)
    if not result or result[0]["count"] < 3:
        return None
    r = result[0]
    return {
        "min":   round(r["min"]),
        "max":   round(r["max"]),
        "avg":   round(r["avg"]),
        "count": r["count"],
    }


async def analyze_dispute(
    request_info: dict,
    messages: list,
    reporter_role: str,
    reason: str,
) -> dict:
    msgs_text = "\n".join(
        f"[{m.get('sender_role', '?')}] {m.get('message', '')}"
        for m in messages[-60:]
    )
    prompt = f"""You are an AI dispute mediator for Khadamni marketplace.
Analyze this service job objectively and return ONLY a JSON object.

Job: {json.dumps(request_info)}
Reporter: {reporter_role}
Reason given: "{reason}"
Chat transcript (last 60 messages):
{msgs_text}

Return exactly this shape:
{{
  "summary": "<2-3 sentence neutral summary>",
  "timeline": ["<key event 1>", "<key event 2>"],
  "agreement_reached": true,
  "agreement_details": "<what was agreed, or null>",
  "evidence_for_client": "<1-2 sentences>",
  "evidence_for_provider": "<1-2 sentences>",
  "recommendation": "client_favored|provider_favored|neutral|insufficient_evidence",
  "confidence": 0.8,
  "suggested_action": "<brief action for moderator>"
}}"""

    text = await _generate(prompt)
    return json.loads(_strip_fences(text))
