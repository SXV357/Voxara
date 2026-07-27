from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user
from database import supabase
from models import Scenario, ScenarioSummary

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


@router.get("/voice-acting", response_model=list[ScenarioSummary])
def list_scenarios(_user: dict = Depends(get_current_user)):
    result = (
        supabase.table("scenarios")
        .select("id,title,context,dimensions")
        .eq("mode", "voice_acting")
        .execute()
    )
    return result.data


@router.get("/{scenario_id}", response_model=Scenario)
def get_scenario(scenario_id: str, _user: dict = Depends(get_current_user)):
    result = (
        supabase.table("scenarios")
        .select("id,title,context,script,dimensions")
        .eq("id", scenario_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return result.data[0]
