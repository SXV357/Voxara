import multiprocessing
from concurrent.futures import ProcessPoolExecutor
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, onboarding, scenarios, sessions, profile
from seed import seed_scenarios
import uvicorn
import os

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
async def lifespan(app: FastAPI):
    seed_scenarios()

    # The audio pipeline (whisper + librosa) is 20–60s of CPU-bound work. Running
    # it in-process — even via BackgroundTasks — pegs every core and holds the GIL,
    # starving the single-process event loop so every other request hangs until it
    # finishes. A separate process has its own interpreter/GIL/CPU scheduling.
    # `spawn` is deliberate: Linux defaults to `fork`, and forking the threaded
    # uvicorn process can deadlock. max_workers=1 → one reused worker, one model load.
    app.state.pipeline_pool = ProcessPoolExecutor(
        max_workers=1,
        mp_context=multiprocessing.get_context("spawn"),
    )
    yield
    # On a graceful stop/reload an in-flight job is dropped; its row stays
    # `processing` (accepted MVP behavior — the user re-records).
    app.state.pipeline_pool.shutdown(wait=False, cancel_futures=False)


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
    current_dir = os.path.dirname(os.path.abspath(__file__))

    uvicorn.run(
        "main:app", 
        host="127.0.0.1", 
        port=8000, 
        reload=True,
        reload_dirs=[current_dir],
        reload_excludes=[
            os.path.join(current_dir, ".venv"),
            "__pycache__",
            "*.pyc"
        ]
    )