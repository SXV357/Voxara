from fastapi import APIRouter, Depends
from auth import get_current_user

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/")
def get_profile(_user: dict = Depends(get_current_user)):
    return {"status": "stub"}


@router.patch("/voice-acting")
def update_profile(_user: dict = Depends(get_current_user)):
    return {"status": "stub"}
