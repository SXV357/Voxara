from fastapi import APIRouter, Depends
from auth import get_current_user

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("/voice-acting")
def create_session(_user: dict = Depends(get_current_user)):
    return {"status": "stub"}


@router.get("/")
def list_sessions(_user: dict = Depends(get_current_user)):
    return {"status": "stub"}


@router.get("/{session_id}")
def get_session(session_id: str, _user: dict = Depends(get_current_user)):
    return {"status": "stub", "id": session_id}
