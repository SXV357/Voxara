from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import onboarding, scenarios, sessions, profile

app = FastAPI(title="Voxara API")

# revisit when deploying
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(onboarding.router, prefix="/api")
app.include_router(scenarios.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
