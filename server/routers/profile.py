from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user
from database import supabase
from models import VoiceActingProfile

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/")
def get_profile(user: dict = Depends(get_current_user)):
    result = supabase.table("profiles").select("*").eq("id", user["sub"]).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return result.data[0]


@router.patch("/voice-acting")
def update_profile(
    body: VoiceActingProfile, user: dict = Depends(get_current_user)
):
    result = (
        supabase.table("profiles")
        .update({"voice_acting_profile": body.model_dump()})
        .eq("id", user["sub"])
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update profile")
    return {"status": "ok"}
