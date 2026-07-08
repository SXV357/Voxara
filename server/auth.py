from functools import lru_cache

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from config import settings

'''
current key in supabase is one signing every new JWT token
standby - key created and ready but not signing anything; exists so rotation can happen
w/o any downtime

previously used still trusted for verification - valid for verification only
but not for signing any new tokens
'''

# pulls 'Authorization: Bearer <token>' header off any request so no manual parsing
# if the header format is correct, it injects credentials object into function
bearer = HTTPBearer()


@lru_cache
def get_jwks() -> dict:
    # project's signing key is ES256 (asymmetric) - verify against the public
    # key set instead of a shared secret
    resp = httpx.get(f"{settings.supabase_url}/auth/v1/.well-known/jwks.json")
    resp.raise_for_status()
    return resp.json()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    '''
    FastAPI dependency - runs check before route body executes

    Verifies the token signature against Supabase's public JWKS
    '''

    try:
        payload = jwt.decode(
            credentials.credentials,
            get_jwks(),
            algorithms=["ES256"],
            audience="authenticated",
            issuer=f"{settings.supabase_url}/auth/v1",
        )
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
