import json

import httpx
from pydantic import ValidationError

from config import settings
from models import Feedback, Transcript, VoiceActingProfile

SYSTEM_PROMPT = """\
You are a voice-acting coach giving feedback on a single recorded take. Your \
job is to help the performer improve, not to grade them.

TONE
- Coaching, never judgemental. Feedback provided should not flatten performance into "right" vs "wrong"
since art is subjective
- Every point must be anchored to a specific timestamp (e.g. "around 0:12") or \
a directly quoted phrase from the transcript. No generic praise, no generic \
criticism.
- Give concrete and actionable fixes in "original → suggested" form wherever you name a problem. The point
is every growth area comes with a suggested path forward

SCORING
- Score ONLY the dimensions listed in the user message for this scenario. Do \
not score, mention, or penalize anything outside that list.
- Scale is 1–5: 3 = competent, 5 = exceptional. Be honest; most real takes sit \
at 3–4.
- The performer's stated goals and profile (subtypes, experience level) shape \
the register of your language and what you treat as a growth edge — they do \
NOT change the numeric scores.

GOALS
- In `summary` and `growth_areas`, where a stated goal bears on this take, \
address it by name and point to the moment it showed up (or didn't). Where a \
goal is orthogonal to what this scenario exercises, ignore it — don't force a \
connection, don't treat its absence as a fault.

OUTPUT
- Return ONLY a JSON object matching this schema, no prose around it:
  {
    "summary": string,
    "dimensions": [{"dimension": string, "score": 1-5, "rationale": string}],
    "strengths": [string],            // max 2, each anchored to a moment
    "growth_areas": [                  // max 3
      {"issue": string, "where": string, "suggestion": string}
    ],
    "pronunciation_notes": string | null
  }
- `dimensions` must contain exactly the scenario's listed dimensions, no more.
"""

_TIMEOUT = httpx.Timeout(60.0)


def _build_user_message(
    profile: VoiceActingProfile,
    scenario: dict,
    transcript: Transcript,
    prosody: dict,
    filler_count: int,
) -> str:
    words_json = json.dumps(
        [w.model_dump() for w in transcript.words], ensure_ascii=False
    )
    return f"""\
PERFORMER
- Subtypes: {", ".join(profile.subtypes) or "none given"}
- Experience level: {profile.experience_level}
- Goals (verbatim): {profile.goals or "None"}

SCENARIO
- Title: {scenario["title"]}
- Context: {scenario["context"]}
- Script:
{scenario["script"]}

DIMENSIONS TO SCORE (exactly these, nothing else):
{", ".join(scenario["dimensions"])}

TRANSCRIPT
{transcript.text}

WORD TIMESTAMPS (JSON)
{words_json}

PROSODY
{json.dumps(prosody, ensure_ascii=False)}

FILLER WORD COUNT: {filler_count}
"""


def _call_model(model: str, user_message: str) -> Feedback:
    resp = httpx.post(
        f"{settings.openrouter_base_url}/chat/completions",
        headers={"Authorization": f"Bearer {settings.openrouter_api_key}"},
        json={
            "model": model,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
        },
        timeout=_TIMEOUT,
    )
    resp.raise_for_status()
    content = resp.json()["choices"][0]["message"]["content"]
    return Feedback.model_validate_json(content)


def generate_feedback(
    profile: VoiceActingProfile,
    scenario: dict,
    transcript: Transcript,
    prosody: dict,
    filler_count: int,
) -> Feedback:
    """Call OpenRouter for structured coaching feedback.

    Tries the primary model, then the fallback once on any error (HTTP, JSON,
    or schema validation). If the fallback also fails, the exception propagates
    and the orchestrator marks the session `failed`.
    """
    user_message = _build_user_message(
        profile, scenario, transcript, prosody, filler_count
    )

    try:
        return _call_model(settings.openrouter_primary_model, user_message)
    except (httpx.HTTPError, KeyError, ValueError, ValidationError):
        return _call_model(settings.openrouter_fallback_model, user_message)
