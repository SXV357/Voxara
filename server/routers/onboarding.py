from fastapi import APIRouter, Depends
from auth import get_current_user

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.post("/voice-acting")
def onboarding_voice_acting(_user: dict = Depends(get_current_user)):
    return {"status": "stub"}
