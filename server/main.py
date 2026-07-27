from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, onboarding, scenarios, sessions, profile
from seed import seed_scenarios
import uvicorn

'''
google oauth setup

- registering app in google cloud console with consent screen info and contact info to get
client ID and secret; made sure to supply callback URL from supabase in cloud console
- enabling google under oauth providers for supabase and updating client ID + secret

neat thing is because auth is handled via supabase anon/public key on frontend there is no need
for an inherent endpoint doing the auth logic, hitting supabase directly etc. one thing which backend
should do and which it of course does at the time is verifying extracted JWT token signature to prevent
situations where the token can just be forged and someone breaking into the application
'''

@asynccontextmanager
async def lifespan(_app: FastAPI):
    seed_scenarios()
    yield


app = FastAPI(title="Voxara API", lifespan=lifespan)

# revisit when deploying
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

app.include_router(auth.router, prefix="/api")
app.include_router(onboarding.router, prefix="/api")
app.include_router(scenarios.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")
app.include_router(profile.router, prefix="/api")

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)