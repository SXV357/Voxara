from fastapi import APIRouter, Depends
from auth import get_current_user

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


@router.get("/voice-acting")
def list_scenarios(_user: dict = Depends(get_current_user)):
    return {"status": "stub"}


@router.get("/{scenario_id}")
def get_scenario(scenario_id: str, _user: dict = Depends(get_current_user)):
    return {"status": "stub", "id": scenario_id}
