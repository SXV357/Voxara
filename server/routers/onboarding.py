from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user
from database import supabase
from models import VoiceActingProfile

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.post("/voice-acting")
def onboarding_voice_acting(
    body: VoiceActingProfile, user: dict = Depends(get_current_user)
):
    user_id = user["sub"]
    result = (
        supabase.table("profiles")
        .update({"voice_acting_profile": body.model_dump()})
        .eq("id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save profile")
    return {"status": "ok"}
