import logging
from concurrent.futures import Future
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    Form,
    HTTPException,
    Request,
    UploadFile,
)

from auth import get_current_user
from database import supabase
from models import SessionDetail, SessionSummary, VoiceActingProfile
from services.audio import load_audio
from services.feedback import generate_feedback
from services.fillers import count_fillers
from services.prosody import analyze
from services.transcription import transcribe

router = APIRouter(prefix="/sessions", tags=["sessions"])
_logger = logging.getLogger(__name__)


def _log_worker_crash(fut: Future) -> None:
    """Runs in the web process when a pipeline future resolves. `run_pipeline`
    catches its own exceptions and writes a `failed` row, so this only trips when
    the worker process itself dies (OOM, segfault, BrokenProcessPool) — the
    session is then stuck in `processing` with nothing else logged."""
    exc = fut.exception()
    if exc is not None:
        _logger.error(
            "pipeline worker died, session left in 'processing': %r", exc
        )


def run_pipeline(
    session_id: str,
    audio_bytes: bytes,
    scenario: dict,
    profile: VoiceActingProfile,
) -> None:
    """Background task: decode → transcribe + prosody + fillers → LLM feedback,
    then flip the session row to `complete`. Any failure flips it to `failed`
    with the error message (the frontend already handles both states)."""
    try:
        audio = load_audio(audio_bytes)
        transcript = transcribe(audio)
        prosody = analyze(audio)
        fillers = count_fillers([w.model_dump() for w in transcript.words])
        feedback = generate_feedback(
            profile, scenario, transcript, prosody, fillers
        )
        supabase.table("sessions").update(
            {
                "status": "complete",
                "transcript": transcript.model_dump(),
                "prosody_data": prosody,
                "feedback": feedback.model_dump(),
            }
        ).eq("id", session_id).execute()
    except Exception as exc:  # noqa: BLE001 — any failure becomes a `failed` row
        supabase.table("sessions").update(
            {"status": "failed", "error_message": str(exc)[:500]}
        ).eq("id", session_id).execute()


@router.post("/voice-acting")
def create_session(
    request: Request,
    audio: UploadFile,
    scenario_id: str = Form(...),
    user: dict = Depends(get_current_user),
):
    user_id = user["sub"]
    audio_bytes = audio.file.read()

    # defensive measure against if someone tries hitting the backend directly with an invalid scenario id
    scenario_res = (
        supabase.table("scenarios")
        .select("id,title,context,script,dimensions")
        .eq("id", scenario_id)
        .execute()
    )
    if not scenario_res.data:
        raise HTTPException(status_code=404, detail="Scenario not found")
    scenario = scenario_res.data[0]

    '''
    again for defense against backdoor access

    on frontend a user cannot record something unless their voice acting profile is set fully - focus areas,
    experience level but someone can create account and hit the endpoint directly so this helps with that
    '''
    profile_res = (
        supabase.table("profiles")
        .select("voice_acting_profile")
        .eq("id", user_id)
        .execute()
    )
    raw_profile = (profile_res.data or [{}])[0].get("voice_acting_profile")
    if not raw_profile:
        raise HTTPException(status_code=400, detail="Voice acting profile not set")
    profile = VoiceActingProfile.model_validate(raw_profile)

    session_id = str(uuid4())
    audio_path = f"{user_id}/{session_id}.webm"
    supabase.storage.from_("recordings").upload(
        audio_path, audio_bytes, {"content-type": "audio/webm"}
    )

    supabase.table("sessions").insert(
        {
            "id": session_id,
            "user_id": user_id,
            "scenario_id": scenario_id,
            "mode": "voice_acting",
            "audio_path": audio_path,
            "status": "processing",
        }
    ).execute()

    fut = request.app.state.pipeline_pool.submit(
        run_pipeline, session_id, audio_bytes, scenario, profile
    )

    # get back future after submitting job (when job ends receipt resolves in web process)
    # this line says when receipt resolves run this (for when worker itself dies not related to processing pipeline at all)
    fut.add_done_callback(_log_worker_crash)

    return {"session_id": session_id}


@router.get("/", response_model=list[SessionSummary])
def list_sessions(user: dict = Depends(get_current_user)):
    # join embedded in .select for sessions.scenario_id = scenarios.id
    # will embed it as "scenarios: {"title": <>}"
    res = (
        supabase.table("sessions")
        .select("id,mode,status,created_at,feedback,scenarios(title)")
        .eq("user_id", user["sub"])
        .order("created_at", desc=True)
        .execute()
    )
    return [
        {
            "id": row["id"],
            "scenario_title": (row.get("scenarios") or {}).get("title", ""),
            "mode": row["mode"],
            "status": row["status"],
            "created_at": row["created_at"],
            "feedback_summary": (row.get("feedback") or {}).get("summary")
            if row["status"] == "complete"
            else None,
        }
        for row in res.data
    ]


@router.get("/{session_id}", response_model=SessionDetail)
def get_session(session_id: str, user: dict = Depends(get_current_user)):
    res = (
        supabase.table("sessions")
        .select(
            "id,status,mode,created_at,transcript,feedback,error_message,"
            "scenarios(id,title,context,dimensions)"
        )
        .eq("id", session_id)
        .eq("user_id", user["sub"])
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Session not found")
    row = res.data[0]
    return {
        "id": row["id"],
        "status": row["status"],
        "mode": row["mode"],
        "scenario": row["scenarios"],
        "transcript": row["transcript"],
        "feedback": row["feedback"],
        "error_message": row["error_message"],
        "created_at": row["created_at"],
    }
