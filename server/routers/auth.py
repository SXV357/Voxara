from fastapi import APIRouter
from pydantic import BaseModel, EmailStr

from database import supabase

router = APIRouter(prefix="/auth", tags=["auth"])


class CheckProviderRequest(BaseModel):
    email: EmailStr


class CheckProviderResponse(BaseModel):
    providers: list[str]


@router.post("/check-provider", response_model=CheckProviderResponse)
def check_provider(body: CheckProviderRequest) -> CheckProviderResponse:
    # ponytail: gotrue's list_users has no email filter, so this scans a page of
    # users and matches in Python. Fine at current scale; swap for a Postgres RPC
    # keyed on auth.users(email) if the user count grows large.
    users = supabase.auth.admin.list_users(per_page=1000)
    match = next(
        (u for u in users if u.email and u.email.lower() == body.email.lower()),
        None,
    )
    if not match:
        return CheckProviderResponse(providers=[])

    # list_users omits `identities` on each row (Supabase trims it for the list
    # endpoint), but app_metadata.providers is populated there regardless.
    providers = match.app_metadata.get("providers", [])
    return CheckProviderResponse(providers=providers)
