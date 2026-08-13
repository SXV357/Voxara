# Voxara MVP Implementation Plan

**Goal:** Build the Voxara MVP in two phases. **Phase 1:** auth, onboarding, voice acting session recording, AI-powered structured feedback, and session history — fully E2E validated. **Phase 2:** extend to Theatre (adds multimodal analysis e.g. mediapipe facial tracking). Theatre tab is visible but disabled throughout Phase 1.

**Architecture:** React 19 + TypeScript SPA (Rsbuild) proxies to a FastAPI backend. Supabase handles auth, Postgres storage, and audio file storage. Backend runs local Whisper + librosa for audio analysis, then calls OpenRouter for structured LLM feedback.

**Tech Stack:** React 19 + TypeScript + shadcn/ui + Tailwind v4 + React Router v7, FastAPI + Python 3.13 + uv, Supabase (Auth + Postgres + Storage), faster-whisper, librosa, httpx, pydantic-settings

## Architecture Rationale

**FastAPI + Python backend** — Whisper and librosa are Python libraries. Keeping audio analysis in the same process as the API avoids a second service and IPC overhead at MVP scale.

**Supabase** — Replaces three separate services (auth server, Postgres, S3) with one. Less infrastructure to manage, fewer credentials, one SDK on both client and server.

**faster-whisper (local, not a hosted API)** — No per-session cost. faster-whisper is a drop-in replacement for openai-whisper built on CTranslate2, optimized for CPU inference. ~2–4x faster transcription and lower memory than openai-whisper on the same hardware, with no GPU required. Tradeoff: still slower than a hosted endpoint. Worth it at MVP scale; swap to hosted if processing time becomes a UX problem.

**OpenRouter** — Model-agnostic layer in front of LLMs. Primary model + one fallback model, both via OpenRouter — swap via env vars, no code changes. MVP traffic won't stress OpenRouter rate limits, but keeping a configured fallback costs nothing and guards against model-specific outages. Ollama (available locally) is not included at MVP; add as a deeper fallback post-MVP if offline resilience matters.

**Curated scenarios only (MVP)** — Knowing the scenario ahead of time lets the backend pass exact `dimensions[]` to the LLM prompt, producing specific anchored feedback. Freeform input requires the LLM to infer what to measure, which degrades specificity — the core product value. Freeform session creation is a V2 feature; at that point the prompting strategy will need to handle dimension inference explicitly.

## Global Constraints

- No singing / musical theatre features anywhere in this plan
- No freeform session builder in MVP — curated scenarios only (4 defined); freeform is a V2 feature requiring a different LLM prompting strategy
- Theatre sidebar entry: visible but disabled (cursor-not-allowed, grayed)
- Theatre (Phase 2) adds multimodal analysis (mediapipe facial tracking); not in scope until voice acting E2E is fully validated
- All LLM feedback must be coaching-tone — system prompt enforces "never evaluative"
- Supabase Storage for audio (not S3/R2 — v2 concern)
- LLM primary/fallback configured via env vars, not hardcoded
- Feedback must reference timestamps or quoted transcript phrases — not generic
- ffmpeg must be installed on the host machine (required by both whisper and librosa for webm)
- All scenario scripts designed to be spoken in ~60 seconds; actual recording time varies by performer pace and scenario pacing (which is itself a feedback dimension)
- Desktop-only for MVP — no responsive/mobile breakpoints anywhere in the app. Mobile is an explicit stretch goal for a future phase, not implicitly covered by "responsive grid" language elsewhere in this plan (e.g. `ScenarioSelectionPage`'s grid reflows column count on wide desktop viewports only, not down to phone widths)

---

## Phase 1A: Setup & Scaffolding — ✅ complete

> Goal: app shell running in browser with design system applied, auth working, all routes stubbed. No business logic yet.

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
- [x] Install frontend deps: `react-router-dom`, `@supabase/supabase-js`, `lucide-react`, `tailwindcss`, `@tailwindcss/postcss`
- [x] Run `npx shadcn@latest init` (Style: Default, Base color: Slate, CSS variables: Yes). Then add components: `button input label card select textarea checkbox badge separator tabs progress`
- [x] Configure rsbuild: Tailwind PostCSS, `@` alias pointing to `src/`, dev proxy from `/api` → `http://localhost:8000`
- [x] Add TypeScript path alias `@/*` → `./src/*`
- [x] Create Supabase browser client reading from `process.env.PUBLIC_SUPABASE_URL` and `process.env.PUBLIC_SUPABASE_ANON_KEY`; populate `.env.local` with values from Supabase dashboard > Settings > API
- [x] Install backend deps via uv: `pydantic-settings supabase python-jose[cryptography] python-multipart httpx faster-whisper librosa soundfile`
- [x] Create pydantic Settings class reading from `.env`: `supabase_url`, `supabase_service_role_key`, `supabase_jwt_secret`, `openrouter_api_key`, `openrouter_primary_model`, `openrouter_fallback_model`
- [x] Create Supabase service-role client
- [x] Create `get_current_user` auth dependency that decodes Supabase JWT from `Authorization: Bearer` header using `python-jose`; raises 401 on failure
- [x] Define core Pydantic models: `VoiceActingProfile` (subtypes: list[str], experience_level: str, goals: str), `FeedbackDimension` (dimension, score 1–5, rationale), `GrowthArea` (issue, where, suggestion), `Feedback` (summary, dimensions[], strengths[], growth_areas[], pronunciation_notes?)
- [x] Create stub routers for onboarding, scenarios, sessions, profile — each returning `{"status": "stub"}`
- [x] Wire up FastAPI app: CORS (allow `http://localhost:3000`), include all 4 routers under `/api/*`
- [x] Create `AuthContext` providing `session`, `user`, `loading` via `supabase.auth.onAuthStateChange`
- [x] Create `ProtectedRoute` component: shows loading state, redirects to `/login` if no session, renders `<Outlet />` if authenticated
- [x] Wire up router + routes: `/login`, and under `ProtectedRoute`: `/dashboard`, `/onboarding/voice-acting`, `/voice-acting/scenarios`, `/voice-acting/record/:scenarioId`, `/sessions/:sessionId/feedback`, `/profile`; catch-all redirects to `/dashboard`
- [x] Create stub pages for all routes (will be filled in subsequent tasks)
- [x] Verify: both servers start — frontend redirects to `/login`, backend shows 4 endpoints at `/docs`
- [x] Commit: `feat: project scaffolding — tailwind, shadcn, react-router, fastapi, supabase, auth middleware`

---

### Task 2: Auth Flow + Layout Shell

**Interfaces:**
- Consumes: `useAuth()`, `supabase.auth.signInWithPassword`, `supabase.auth.signUp`, `supabase.auth.signOut`
- Produces: `DashboardLayout` wrapper used by every authenticated page

**Steps:**
- [x] Build `LoginPage`: email/password form with toggle between "Sign in" / "Sign up" mode. On success navigate to `/dashboard`. Show inline error on failure.
- [x] Build `Sidebar`: left-side nav with "Voice Acting" as a `NavLink` to `/voice-acting/scenarios`, "Theatre" as a non-clickable grayed div, and bottom section with Profile link + Sign out button.
- [x] Build `DashboardLayout`: flex row with `Sidebar` on the left, scrollable `main` on the right. Wraps all authenticated pages.
- [x] Update all stub pages to use `DashboardLayout`.
- [x] Manual test: unauthenticated → redirects to `/login`; sign up → lands on `/dashboard` with sidebar; Theatre entry is unclickable; sign out → `/login`; sign in → `/dashboard`
- [x] Commit: `feat: auth flow — login/signup, sidebar layout, protected routes`

---

## Phase 1A → 1B Checkpoint

Before proceeding to business logic, verify:
- [x] Both servers start cleanly
- [x] Design system tokens render correctly in the browser (check `/#design-preview`)
- [x] Auth works end-to-end (sign up, sign in, sign out, protected route redirect)
- [x] All stub pages reachable and using `DashboardLayout`
- [x] Theatre sidebar entry is visible but unclickable

This is the design iteration point. If the shell layout, typography, spacing, or component feel needs work, iterate here — with or without `/impeccable` — before any business logic is built on top of it. Changes to layout structure are cheap now, expensive later.

---

## Phase 1B: Business Logic

> Goal: full voice acting E2E — onboarding → scenario selection → recording → AI feedback → session history.

### Task 3: Voice Acting Onboarding

**Interfaces:**
- `POST /api/onboarding/voice-acting` body: `VoiceActingProfile` → `{ status: "ok" }`
- Guard logic: on entering `/voice-acting/scenarios`, fetch `profiles.voice_acting_profile` for the current user. If null → redirect to `/onboarding/voice-acting`. If exists → proceed.

**Steps:**
- [x] Implement `POST /api/onboarding/voice-acting`: validates body as `VoiceActingProfile`, updates `profiles.voice_acting_profile` in Supabase for the current user.
- [x] Build `OnboardingVoiceActingPage`: form with three fields — subtypes (multi-select checkboxes: Commercial / Audiobook / Character & Animation / Narration; at least one required), experience level (Select: Just starting out / Some experience / Intermediate), goals (freeform textarea: user describes what they're working on in their own words; required). On submit, POST to backend; on success navigate to `/voice-acting/scenarios`.
- [x] Add onboarding guard to `ScenarioSelectionPage`: on mount, fetch profile and redirect to `/onboarding/voice-acting` if `voice_acting_profile` is null.
- [x] Manual test: new user → clicking "Voice Acting" redirects to onboarding; fill form → submit → lands on scenarios (blank); Supabase profiles table shows populated `voice_acting_profile`; refresh scenarios page → no redirect
- [x] Commit: `feat: voice acting onboarding flow`

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
- [x] Implement `GET /api/scenarios/voice-acting` and `GET /api/scenarios/{id}` endpoints — both require auth.
- [x] Write `seed_scenarios()` in `server/seed.py` — clears existing voice_acting scenarios then inserts the 4 above. Run automatically on app startup via FastAPI `lifespan` (not a manually-run script — one less step to remember). Expected on startup: "Seeded 4 scenarios."
- [x] Build `ScenarioCard` component: shows title, truncated context description, dimension badges, and a "Select" button.
- [x] Complete `ScenarioSelectionPage`: fetches scenarios from API, renders a responsive grid of `ScenarioCard`s. Selecting a card navigates to `/voice-acting/record/:scenarioId`.
- [x] Manual test: 4 cards visible with correct titles and dimension badges; clicking "Select" navigates to recording page URL
- [x] Commit: `feat: curated scenario library — 4 scenarios seeded, selection UI`

---

### Task 5: In-App Audio Recording

**Interfaces:**
- Consumes: `GET /api/scenarios/:id` for displaying scenario context + script
- Produces: `audioBlob: Blob` (audio/webm) submitted as multipart FormData to `POST /api/sessions/voice-acting`

> **Why MediaRecorder (browser-native, no library):** MediaRecorder is supported in all modern browsers and produces webm/opus natively — no client dependency needed. The tradeoff is that webm can't be processed directly by Whisper or librosa; ffmpeg on the server handles conversion (see Task 6).

> **Why scripts are designed for ~60 seconds:** All four MVP scenarios (commercial, villain monologue, multi-character scene, nature documentary) are scripted to be deliverable in roughly 60 seconds. Commercials are 15–60s by industry standard; anime-style villain monologues are punchy and declarative (~20–40s of delivery); multi-character exchanges cover 2–3 back-and-forths; narration units are standard at 60s. Actual recording time will vary — performers speak at different paces, and pacing is itself a feedback dimension. This is a script design constraint, not a hard recording cutoff. It keeps Whisper `base` processing time at ~15–30s (acceptable UX) and ensures full timestamp sending stays token-efficient.

**`useAudioRecorder` hook states:** `idle` → `recording` → `stopped`. Exposes: `start()`, `stop()`, `reset()`, `audioBlob`, `audioUrl` (object URL for playback).

**Steps:**
- [x] Build `useAudioRecorder` hook using `navigator.mediaDevices.getUserMedia` + `MediaRecorder`. On stop, assemble chunks into a `Blob` and create an object URL. `reset()` revokes the URL and clears state. Also exposes `pause()`/`resume()` (state adds a `paused` value between `recording` and `stopped`), the live `MediaStream` (for the waveform), and a typed `error` (`permission-denied` / `no-device` / `unsupported` / `unknown`).
- [x] Build `RecordingPage`: fetches scenario by ID from API; displays scenario title, context, script, dimension badges, and the performer's own `goals` text (read-only, unfiltered — see Task 5 note below). Recording controls: "Start Recording" → "Pause"/"Stop" while live → shows audio playback + "Submit for Feedback" / "Re-record". On submit, POSTs FormData (`audio` file + `scenario_id`) to `/api/sessions/voice-acting`, then navigates to `/sessions/:session_id/feedback`. Shows a "processing may take 20–40 seconds" note while submitting.
- [x] Manual test: scenario content displays correctly; mic permission prompt appears on start; audio player appears after stop; re-record resets; submit will 422 until Task 6 (expected)
- [ ] Commit: `feat: in-app audio recording via MediaRecorder API`

> **Why goals display verbatim, unfiltered:** The performer's freeform `goals` text is shown as-is next to the scenario's dimension badges ("Your goal: …") rather than filtered down to whichever parts are "relevant" to this scenario. Judging relevance is a semantic task that needs an LLM call — there's no endpoint for it, and Task 6's feedback pipeline already does this server-side (full profile + scenario passed together into the feedback prompt). Building a client-side relevance heuristic here would either guess or fake it; the honest move is showing the goal text plainly and letting the actual weighting happen invisibly in the backend, where it already belongs.

---

### Task 6: Backend Processing Pipeline

**Interfaces:**
- `POST /api/sessions/voice-acting` multipart: `audio` (file), `scenario_id` (str) → `{ session_id: str }`
- `GET /api/sessions/` → list of user's sessions (id, scenario title, feedback summary, created_at)
- `GET /api/sessions/{session_id}` → full session including transcript + feedback

> **Why ffmpeg is required:** Browser MediaRecorder outputs webm/opus. Both Whisper and librosa need PCM audio (WAV, 16kHz mono). This conversion is unavoidable — ffmpeg is the standard tool for it. This is the main host environment prerequisite; the pipeline will silently fail without it.

> **Why faster-whisper `base` model as default:** faster-whisper `base` (~140MB) runs on CPU with CTranslate2 optimizations, processing a 60s clip in ~8–15s (roughly 2x faster than openai-whisper on the same hardware). The `small` model offers marginal accuracy gain for deliberate close-mic voice acting delivery and is noticeably slower. Base is sufficient for MVP; swap to `small` if users with strong accents or noisy environments report transcript errors.

> **Why full word timestamps go to the LLM:** Feedback anchored to specific moments requires timestamps across the full recording — a notable moment can occur anywhere, not just the opening seconds. With all four scenarios scripted for ~60 seconds (~150 words max), the full timestamp list is ~150 JSON objects — negligible token cost well within the model's 131k context window.

> **Why feedback must reference timestamps (the constraint):** Without this, LLMs default to generic coaching ("great energy!") that has no actionable value. Requiring timestamp or quote anchoring forces specificity. The tradeoff: the LLM prompt must be carefully engineered to produce valid references, and the output needs validation.

**Prerequisite:** ffmpeg installed (`brew install ffmpeg` / `sudo apt install ffmpeg`)

**Pipeline flow:**
1. Convert webm → 16kHz mono WAV once (reused by both Whisper and librosa)
2. Store original webm in Supabase Storage at `{user_id}/{session_id}.webm`
3. Whisper transcribes WAV with `word_timestamps=True` → full transcript text + per-word timestamps
4. librosa analyzes WAV → pitch mean/std/range (via `pyin`), tempo (via `beat_track`), RMS energy mean/std
5. Filler word detection scans word list for: um, uh, like, basically, actually, literally, right, so, "you know"
6. LLM prompt assembled with: performer profile, scenario context, dimensions to evaluate, full transcript, full word timestamps, prosody data, filler count
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

> Profile Page portion pulled forward and completed ahead of schedule (before Task 5-7's sessions pipeline existed) — see below. Session History Dashboard remains, since it depends on `GET /api/sessions/` from Task 6.

**Interfaces:**
- `GET /api/sessions/` — already implemented in Task 6
- `GET /api/profile/` → full profile row
- `PATCH /api/profile/voice-acting` → updates `voice_acting_profile`

**Steps:**
- [x] Implement `GET /api/profile/` and `PATCH /api/profile/voice-acting` endpoints.
- [ ] Build `DashboardPage`: heading + "New Session" button. Fetches session list on mount. Renders clickable cards showing scenario title, feedback summary preview (line-clamp), and date. Clicking navigates to `/sessions/:id/feedback`. Empty state message if no sessions.
- [x] Build `ProfilePage`: shows user email (and name, if captured at signup). Form pre-populated from `GET /api/profile/` with same fields as onboarding — subtypes (multi-select checkboxes, same options), experience level (same select), goals (freeform textarea pre-populated with saved value). On save, PATCHes `/api/profile/voice-acting`. Shows "Saved!" confirmation for 2 seconds. Theatre profile editing deferred — no theatre onboarding flow exists yet to have populated it, and Theatre stays out of scope until voice acting E2E is validated (per Global Constraints).
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
