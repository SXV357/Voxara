# Voxara
 
A speech and performance coaching platform for voice actors and theatre performers. Users record a take against a curated scenario and get LLM-generated feedback on vocal delivery, pacing, and expression.
 
**Status:** In progress. Auth, onboarding, scenario selection, in-browser audio recording, and the full backend feedback pipeline (transcription + prosody analysis + LLM coaching) are built and working end-to-end. Dashboard/feedback UI polish and a theatre-performer mode are still ahead.
 
## Stack
 
- **Frontend:** React Router v7, Tailwind v4, shadcn/ui, Supabase JS client
- **Backend:** FastAPI, Supabase (Postgres + Auth), faster-whisper, librosa, OpenRouter
- **Pipeline:** audio → Whisper transcription + librosa prosody analysis (pitch, tempo, pacing) → LLM-generated feedback, run in a separate worker process so it doesn't block the API
## Running locally
 
```bash
# Frontend — localhost:3000
cd client && npm run dev
 
# Backend — localhost:8000, docs at /docs
cd server && uv run fastapi dev main.py
```
 
## More detail
 
- [`CHANGES.md`](./CHANGES.md) — what's built, and why, area by area
- [`DESIGN.md`](./DESIGN.md) — design system / visual spec
- [`PRD.md`](./PRD.md) / [`PLAN.md`](./PLAN.md) — product scope and phased build plan
