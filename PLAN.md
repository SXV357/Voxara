# Voxara MVP Implementation Plan

**Goal:** Build the Voxara MVP — auth, voice acting session recording, AI-powered structured feedback, and session history — with Theatre tab present but disabled until voice acting E2E is validated.

**Architecture:** React 19 + TypeScript SPA (Rsbuild) proxies to a FastAPI backend. Supabase handles auth, Postgres storage, and audio file storage. Backend runs local Whisper + librosa for audio analysis, then calls OpenRouter for structured LLM feedback.

**Tech Stack:** React 19 + TypeScript + shadcn/ui + Tailwind v4 + React Router v7, FastAPI + Python 3.13 + uv, Supabase (Auth + Postgres + Storage), openai-whisper, librosa, httpx, pydantic-settings

## Architecture Rationale

**FastAPI + Python backend** — Whisper and librosa are Python libraries. Keeping audio analysis in the same process as the API avoids a second service and IPC overhead at MVP scale.

**Supabase** — Replaces three separate services (auth server, Postgres, S3) with one. Less infrastructure to manage, fewer credentials, one SDK on both client and server.

**Local Whisper (not a hosted API)** — No per-session cost. Tradeoff: cold-start latency (~10s on first load) and slower processing than a hosted endpoint. Worth it at MVP scale; swap to hosted if processing time becomes a user experience problem.

**OpenRouter** — Model-agnostic layer in front of LLMs. Swap models (or activate the fallback) via env vars, no code changes. LLM availability and rate limits are real operational risks worth hedging against.

**Curated scenarios only** — Knowing the scenario ahead of time lets the backend pass exact `dimensions[]` to the LLM prompt. Freeform input would require the LLM to guess what to measure, which degrades feedback specificity — the core product value.

## Global Constraints

- No singing / musical theatre features anywhere in this plan
- No freeform session builder — curated scenarios only (4 defined below)
- Theatre sidebar entry: visible but disabled (cursor-not-allowed, grayed)
- All LLM feedback must be coaching-tone — system prompt enforces "never evaluative"
- Supabase Storage for audio (not S3/R2 — v2 concern)
- LLM primary/fallback configured via env vars, not hardcoded
- Feedback must reference timestamps or quoted transcript phrases — not generic
- ffmpeg must be installed on the host machine (required by both whisper and librosa for webm)

---

### Task 1: Project Setup & Scaffolding

**Supabase setup (manual — run in Supabase dashboard > SQL editor):**

Three tables to create:
- `profiles` — extends `auth.users`, stores `voice_acting_profile` (jsonb) and `theatre_profile` (jsonb). RLS: user can only read/write own row. Trigger: auto-insert profile row on new user signup.
- `scenarios` — stores curated scenarios with `mode`, `title`, `context`, `script`, `dimensions[]`. RLS: authenticated read.
- `sessions` — stores recording sessions with `user_id`, `scenario_id`, `mode`, `audio_path`, `transcript` (jsonb), `prosody_data` (jsonb), `feedback` (jsonb). RLS: user can only read/write own rows.

**Supabase Storage:** Create a private bucket named `recordings`.

> **Why JSONB for transcript/prosody/feedback columns:** Feedback shape will almost certainly change between v1 and v2 as the LLM prompt is tuned. JSONB lets us iterate without schema migrations. Tradeoff: no column-level indexing on feedback fields — acceptable for MVP query patterns.

> **Why a Supabase trigger for auto-inserting the profile row:** If the app handles profile insertion after signup, any failure (network drop, edge case) leaves a user with no profile row, breaking all downstream queries. A DB trigger runs inside Supabase and is guaranteed.

**Steps:**
- [ ] Install frontend deps: `react-router-dom`, `@supabase/supabase-js`, `lucide-react`, `tailwindcss`, `@tailwindcss/postcss`
- [ ] Run `npx shadcn@latest init` (Style: Default, Base color: Slate, CSS variables: Yes). Then add components: `button input label card select textarea checkbox badge separator tabs progress`
- [ ] Configure rsbuild: Tailwind PostCSS, `@` alias pointing to `src/`, dev proxy from `/api` → `http://localhost:8000`
- [ ] Add TypeScript path alias `@/*` → `./src/*`
- [ ] Create Supabase browser client reading from `process.env.PUBLIC_SUPABASE_URL` and `process.env.PUBLIC_SUPABASE_ANON_KEY`; populate `.env.local` with values from Supabase dashboard > Settings > API
- [ ] Install backend deps via uv: `pydantic-settings supabase python-jose[cryptography] python-multipart httpx openai-whisper librosa soundfile`
- [ ] Create pydantic Settings class reading from `.env`: `supabase_url`, `supabase_service_role_key`, `supabase_jwt_secret`, `openrouter_api_key`, `openrouter_primary_model`, `openrouter_fallback_model`
- [ ] Create Supabase service-role client
- [ ] Create `get_current_user` auth dependency that decodes Supabase JWT from `Authorization: Bearer` header using `python-jose`; raises 401 on failure
- [ ] Define core Pydantic models: `VoiceActingProfile` (subtype, experience_level, goals), `FeedbackDimension` (dimension, score 1–5, rationale), `GrowthArea` (issue, where, suggestion), `Feedback` (summary, dimensions[], strengths[], growth_areas[], pronunciation_notes?)
- [ ] Create stub routers for onboarding, scenarios, sessions, profile — each returning `{"status": "stub"}`
- [ ] Wire up FastAPI app: CORS (allow `http://localhost:3000`), include all 4 routers under `/api/*`
- [ ] Create `AuthContext` providing `session`, `user`, `loading` via `supabase.auth.onAuthStateChange`
- [ ] Create `ProtectedRoute` component: shows loading state, redirects to `/login` if no session, renders `<Outlet />` if authenticated
- [ ] Wire up router + routes: `/login`, and under `ProtectedRoute`: `/dashboard`, `/onboarding/voice-acting`, `/voice-acting/scenarios`, `/voice-acting/record/:scenarioId`, `/sessions/:sessionId/feedback`, `/profile`; catch-all redirects to `/dashboard`
- [ ] Create stub pages for all routes (will be filled in subsequent tasks)
- [ ] Verify: both servers start — frontend redirects to `/login`, backend shows 4 endpoints at `/docs`
- [ ] Commit: `feat: project scaffolding — tailwind, shadcn, react-router, fastapi, supabase, auth middleware`

---

### Task 2: Auth Flow + Layout Shell

**Interfaces:**
- Consumes: `useAuth()`, `supabase.auth.signInWithPassword`, `supabase.auth.signUp`, `supabase.auth.signOut`
- Produces: `DashboardLayout` wrapper used by every authenticated page

**Steps:**
- [ ] Build `LoginPage`: email/password form with toggle between "Sign in" / "Sign up" mode. On success navigate to `/dashboard`. Show inline error on failure.
- [ ] Build `Sidebar`: left-side nav with "Voice Acting" as a `NavLink` to `/voice-acting/scenarios`, "Theatre" as a non-clickable grayed div, and bottom section with Profile link + Sign out button.
- [ ] Build `DashboardLayout`: flex row with `Sidebar` on the left, scrollable `main` on the right. Wraps all authenticated pages.
- [ ] Update all stub pages to use `DashboardLayout`.
- [ ] Manual test: unauthenticated → redirects to `/login`; sign up → lands on `/dashboard` with sidebar; Theatre entry is unclickable; sign out → `/login`; sign in → `/dashboard`
- [ ] Commit: `feat: auth flow — login/signup, sidebar layout, protected routes`

---

### Task 3: Voice Acting Onboarding

**Interfaces:**
- `POST /api/onboarding/voice-acting` body: `VoiceActingProfile` → `{ status: "ok" }`
- Guard logic: on entering `/voice-acting/scenarios`, fetch `profiles.voice_acting_profile` for the current user. If null → redirect to `/onboarding/voice-acting`. If exists → proceed.

**Steps:**
- [ ] Implement `POST /api/onboarding/voice-acting`: validates body as `VoiceActingProfile`, updates `profiles.voice_acting_profile` in Supabase for the current user.
- [ ] Build `OnboardingVoiceActingPage`: form with three fields — subtype (Select: Commercial / Audiobook / Character & Animation / Narration), experience level (Select: Just starting out / Some experience / Intermediate), goals (Checkboxes: reduce fillers, character differentiation, mic technique, pacing, expressiveness). Requires all fields + at least one goal. On submit, POST to backend; on success navigate to `/voice-acting/scenarios`.
- [ ] Add onboarding guard to `ScenarioSelectionPage`: on mount, fetch profile and redirect to `/onboarding/voice-acting` if `voice_acting_profile` is null.
- [ ] Manual test: new user → clicking "Voice Acting" redirects to onboarding; fill form → submit → lands on scenarios (blank); Supabase profiles table shows populated `voice_acting_profile`; refresh scenarios page → no redirect
- [ ] Commit: `feat: voice acting onboarding flow`

---

### Task 4: Scenario Library

**Interfaces:**
- `GET /api/scenarios/voice-acting` → `Scenario[]` (id, title, context, dimensions)
- `GET /api/scenarios/{scenario_id}` → full `Scenario` including script

**The 4 curated scenarios (seeded into DB):**

| # | Title | Dimensions targeted |
|---|-------|-------------------|
| 1 | Villain Monologue | tonal_differentiation, pitch_variance, intentional_pausing |
| 2 | Fast Food Commercial | pacing, pitch_variance, enunciation, filler_words |
| 3 | Multi-Character Audiobook Dialogue | character_differentiation, breath_support, pacing |
| 4 | Nature Documentary Narration | breath_support, pacing, enunciation |

> **Why a seed script instead of a migration:** Scenarios are content, not schema. A script is easier to re-run and modify as scenario scripts and dimensions are refined before launch. Baking content into a migration makes it harder to update later.

**Steps:**
- [ ] Implement `GET /api/scenarios/voice-acting` and `GET /api/scenarios/{id}` endpoints — both require auth.
- [ ] Write seed script — clears existing voice_acting scenarios then inserts the 4 above. Run with `uv run python scripts/seed_scenarios.py`. Expected: "Seeded 4 scenarios."
- [ ] Build `ScenarioCard` component: shows title, truncated context description, dimension badges, and a "Select" button.
- [ ] Complete `ScenarioSelectionPage`: fetches scenarios from API, renders a responsive grid of `ScenarioCard`s. Selecting a card navigates to `/voice-acting/record/:scenarioId`.
- [ ] Manual test: 4 cards visible with correct titles and dimension badges; clicking "Select" navigates to recording page URL
- [ ] Commit: `feat: curated scenario library — 4 scenarios seeded, selection UI`

---

### Task 5: In-App Audio Recording

**Interfaces:**
- Consumes: `GET /api/scenarios/:id` for displaying scenario context + script
- Produces: `audioBlob: Blob` (audio/webm) submitted as multipart FormData to `POST /api/sessions/voice-acting`

> **Why MediaRecorder (browser-native, no library):** MediaRecorder is supported in all modern browsers and produces webm/opus natively — no client dependency needed. The tradeoff is that webm can't be processed directly by Whisper or librosa; ffmpeg on the server handles conversion (see Task 6).

**`useAudioRecorder` hook states:** `idle` → `recording` → `stopped`. Exposes: `start()`, `stop()`, `reset()`, `audioBlob`, `audioUrl` (object URL for playback).

**Steps:**
- [ ] Build `useAudioRecorder` hook using `navigator.mediaDevices.getUserMedia` + `MediaRecorder`. On stop, assemble chunks into a `Blob` and create an object URL. `reset()` revokes the URL and clears state.
- [ ] Build `RecordingPage`: fetches scenario by ID from API; displays scenario title, context, and script. Recording controls: "Start Recording" → "Stop Recording" → shows audio playback + "Submit for Feedback" / "Re-record". On submit, POSTs FormData (`audio` file + `scenario_id`) to `/api/sessions/voice-acting`, then navigates to `/sessions/:session_id/feedback`. Shows a "processing may take 20–40 seconds" note while submitting.
- [ ] Manual test: scenario content displays correctly; mic permission prompt appears on start; audio player appears after stop; re-record resets; submit will 422 until Task 6 (expected)
- [ ] Commit: `feat: in-app audio recording via MediaRecorder API`

---

### Task 6: Backend Processing Pipeline

**Interfaces:**
- `POST /api/sessions/voice-acting` multipart: `audio` (file), `scenario_id` (str) → `{ session_id: str }`
- `GET /api/sessions/` → list of user's sessions (id, scenario title, feedback summary, created_at)
- `GET /api/sessions/{session_id}` → full session including transcript + feedback

> **Why ffmpeg is required:** Browser MediaRecorder outputs webm/opus. Both Whisper and librosa need PCM audio (WAV, 16kHz mono). This conversion is unavoidable — ffmpeg is the standard tool for it. This is the main host environment prerequisite; the pipeline will silently fail without it.

> **Why Whisper `base` model as default:** Base (~140MB) runs on CPU and processes a 60s clip in ~15–30s. The `small` model is ~4x slower for marginal accuracy gain on clear close-mic speech. Voice acting is deliberate delivery — base accuracy is sufficient. Caveat: if users record in noisy environments or with strong accents, `small` may be worth the latency cost.

> **Why only the first 40 word timestamps go to the LLM:** LLM token cost. 40 words covers ~15–20 seconds of speech — enough for the model to anchor feedback to specific moments. Sending the full word list for a 2-minute recording balloons cost with diminishing returns; the feedback doesn't meaningfully improve past the first ~20 seconds of examples.

> **Why feedback must reference timestamps (the constraint):** Without this, LLMs default to generic coaching ("great energy!") that has no actionable value. Requiring timestamp or quote anchoring forces specificity. The tradeoff: the LLM prompt must be carefully engineered to produce valid references, and the output needs validation.

**Prerequisite:** ffmpeg installed (`brew install ffmpeg` / `sudo apt install ffmpeg`)

**Pipeline flow:**
1. Convert webm → 16kHz mono WAV once (reused by both Whisper and librosa)
2. Store original webm in Supabase Storage at `{user_id}/{session_id}.webm`
3. Whisper transcribes WAV with `word_timestamps=True` → full transcript text + per-word timestamps
4. librosa analyzes WAV → pitch mean/std/range (via `pyin`), tempo (via `beat_track`), RMS energy mean/std
5. Filler word detection scans word list for: um, uh, like, basically, actually, literally, right, so, "you know"
6. LLM prompt assembled with: performer profile, scenario context, dimensions to evaluate, full transcript, first 40 word timestamps, prosody data, filler count
7. OpenRouter called with primary model; falls back to fallback model on any error
8. LLM response validated as `Feedback` Pydantic model
9. Session row inserted into Supabase with all analysis data + feedback JSON

**LLM system prompt rules (enforced):**
- Feedback coaching-tone only, never evaluative
- All feedback anchored to specific timestamps or quoted phrases
- Concrete alternatives in "original → suggested" format
- Scores 1–5 per dimension (3 = competent, 5 = exceptional)
- Max 2 strengths, max 3 growth areas
- Evaluate only the dimensions listed for the scenario

**Whisper model:** defaults to `"base"` (~140MB). Swap to `"small"` for better accuracy.

**Steps:**
- [ ] Create audio conversion service: `to_wav(audio_bytes: bytes) -> bytes` — writes webm to temp file, runs `ffmpeg -ac 1 -ar 16000`, returns WAV bytes, cleans up temp files
- [ ] Create transcription service: module-level model singleton loaded lazily on first call. `transcribe(wav_bytes)` returns whisper result dict. Parse into flat transcript text + word list with timestamps.
- [ ] Create prosody service: `analyze(wav_bytes) -> dict` returning duration, pitch mean/std/range, tempo BPM, RMS mean/std
- [ ] Create filler word detector: strips punctuation, checks against filler sets, handles two-word fillers
- [ ] Create feedback service: assemble LLM prompt, call OpenRouter with primary then fallback model, validate JSON response as `Feedback` model.
- [ ] Implement sessions router: `POST /voice-acting` orchestrates the full pipeline and persists result; `GET /` lists user sessions with scenario title join; `GET /{id}` returns full session.
- [ ] Verify end-to-end via frontend recording page: whisper loads model on first run (~10s), processing completes in 15–40s, session row appears in Supabase with populated `feedback` column
- [ ] Commit: `feat: voice acting processing pipeline — whisper, librosa, filler detection, openrouter feedback`

---

### Task 7: Feedback Screen

**Interfaces:**
- Consumes: `GET /api/sessions/:sessionId` → `{ feedback, transcript: { text, words[] } }`

**`FeedbackView` sections:**
- Session Summary card — coaching-tone paragraph
- Dimension Scores card — each dimension shows name, 5-pip score bar (filled/empty), 1–2 sentence rationale
- Strengths card — checkmark list, each anchored to a moment
- Growth Areas card — each shows issue, timestamp/quote badge, concrete suggestion
- Pronunciation & Mic Notes card — only rendered if non-null

**Steps:**
- [ ] Build `FeedbackView` component with the four/five cards above. Score pips: 5 small rectangles, filled up to score value.
- [ ] Build `FeedbackPage`: fetches session by ID; shows "Loading…" during fetch. Layout has heading + "New Session" button. Two tabs: "Feedback" (renders `FeedbackView`) and "Transcript" (renders word list with timestamp annotations).
- [ ] Full E2E test: select "Fast Food Commercial" → record → submit → feedback page renders all sections with scenario-specific content; transcript tab shows timestamped words; "New Session" returns to scenario selection
- [ ] Commit: `feat: feedback screen with rubric scores, strengths, growth areas, timestamped transcript`

---

### Task 8: Session History Dashboard + Profile Page

**Interfaces:**
- `GET /api/sessions/` — already implemented in Task 6
- `GET /api/profile/` → full profile row
- `PATCH /api/profile/voice-acting` → updates `voice_acting_profile`

**Steps:**
- [ ] Implement `GET /api/profile/` and `PATCH /api/profile/voice-acting` endpoints.
- [ ] Build `DashboardPage`: heading + "New Session" button. Fetches session list on mount. Renders clickable cards showing scenario title, feedback summary preview (line-clamp), and date. Clicking navigates to `/sessions/:id/feedback`. Empty state message if no sessions.
- [ ] Build `ProfilePage`: shows user email. Form pre-populated from `GET /api/profile/` with same fields as onboarding (subtype, experience level, goals). On save, PATCHes `/api/profile/voice-acting`. Shows "Saved!" confirmation for 2 seconds.
- [ ] Manual test: complete 2 sessions → dashboard shows both clickable cards; click → correct feedback page; profile shows current onboarding data; edit + save → changes persist; do another session → feedback framing reflects updated profile
- [ ] Commit: `feat: session history dashboard + profile page with editable voice acting settings`

---

## Verification Checklist (Success Criteria per PRD §11)

- [ ] New user can sign up, sign in, sign out
- [ ] First Voice Acting entry triggers onboarding — completes in 1 form submit
- [ ] Onboarding data visible and editable in Profile page
- [ ] 4 scenario cards visible on selection screen with dimension badges
- [ ] Can record audio in-browser (mic permission prompt works)
- [ ] Processing returns structured feedback anchored to transcript moments
- [ ] Feedback framing differs between Commercial and Narration profiles (test manually by updating profile and recording same content)
- [ ] Dashboard shows all past sessions; clicking navigates to feedback screen
- [ ] Theatre sidebar entry is visible but disabled (grayed, no click)
- [ ] No singing / theatre business logic exists anywhere in codebase
