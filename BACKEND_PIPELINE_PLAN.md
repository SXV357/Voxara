# Voxara — Backend Audio Processing & Feedback Pipeline (PLAN.md Task 6)

## Context

`RecordingPage` (Task 5) is done: it records a webm blob and POSTs it to
`POST /api/sessions/voice-acting`. That endpoint is still a stub returning
`{"status": "stub"}` — nothing is transcribed, analyzed, or scored, and no session
row is written. The Feedback/Dashboard UI (committed `7a22ef7`) is built but runs
entirely off `client/src/lib/mockSessions.ts`.

This task builds the real pipeline: **webm bytes → decode to a 16 kHz mono float32
array (faster-whisper's bundled PyAV) → transcript (faster-whisper) + prosody
(librosa) + filler count → LLM feedback (OpenRouter) → persisted `sessions` row**,
then swaps the frontend mock for real API calls.

> **No explicit webm→WAV / ffmpeg step.** `faster_whisper.audio.decode_audio(BytesIO)`
> decodes + resamples via PyAV's bundled FFmpeg libraries (no system `ffmpeg` binary)
> and returns a float32 mono ndarray at 16 kHz. `model.transcribe()` takes that ndarray
> as-is (skips its internal decode), and every librosa function we need accepts
> `y=<array>, sr=16000` directly — so librosa never touches a file and never hits its
> deprecated `audioread`/ffmpeg fallback. One decode, shared by both. PLAN.md step 1
> ("convert webm → WAV once") is satisfied in-memory by this decode; the `to_wav`
> subprocess service it implies is unnecessary. The system-`ffmpeg` prerequisite in
> PLAN.md / CLAUDE.md no longer applies to this path (harmless to keep installed).

Decisions locked with the user:
- **BackgroundTasks**, not a blocking request. POST inserts a `processing` row and
  returns `{session_id}` immediately; a FastAPI background task runs the pipeline and
  flips the row to `complete` / `failed`. Matches the already-built polling frontend
  (`usePolling`, `FeedbackSkeleton`, `SessionStatus`). No Celery/queue — MVP is
  single-process; a mid-run server restart orphaning a `processing` row is acceptable.
- **Scope includes the frontend swap** — delete `mockSessions.ts`, wire
  `DashboardPage` + `FeedbackPage` to `fetch('/api/sessions/...')`.
- `sessions` table and private `recordings` bucket **already exist** (user verified).
- **Adopt Supabase CLI migrations** (Phase 0) — the schema currently lives only in the
  hosted project (hand-run SQL). Baseline it into `supabase/migrations/`, and make this
  task's `sessions` change the first tracked migration.

## Phase 0 — Adopt Supabase CLI migrations + one schema change

Today the whole schema (`scenarios`, `profiles`, `sessions`, the new-signup trigger,
RLS) lives only in the hosted Supabase project — every statement was pasted into the
SQL editor by hand, nothing is in the repo. Before touching the pipeline, bring
migrations under version control so the DB is reproducible and this task's schema
change is tracked.

User runs (needs the DB password from the Supabase dashboard → Project Settings →
Database):

```bash
brew install supabase/tap/supabase          # CLI, not a project dep
cd <repo root>
supabase init                                # creates supabase/config.toml, supabase/.gitignore
supabase link --project-ref prfzkqgidbqsrpovctjt
supabase db pull                             # → supabase/migrations/<ts>_remote_schema.sql
                                             #   (captures the current live public schema as the baseline)
```

Commit that baseline migration as-is (commit 1: `chore: adopt supabase migrations, baseline schema`).

Then the one change this task needs — `sessions` has **no status tracking** (current
columns: `id, user_id, scenario_id, mode, audio_path, transcript, prosody_data,
feedback, created_at`):

```bash
supabase migration new session_status
```

Fill the generated file with:

```sql
alter table sessions
  add column status text not null default 'processing',
  add column error_message text;

alter table sessions
  add constraint sessions_status_check
  check (status in ('processing', 'complete', 'failed'));
```

```bash
supabase db push                             # applies it to the linked hosted project
```

Commit (commit 2: `feat: sessions.status + error_message for pipeline state`).

Notes:
- **`seed.py` stays as-is** — it's a runtime reseed on every boot, a different concern
  from schema. The empty `supabase/seed.sql` that `init` creates is only used by local
  `supabase db reset`; leave it.
- **RLS**: backend uses the service-role key (bypasses RLS) and the frontend reads
  sessions only through the API, so no policy work is needed here. Whatever policies
  exist are captured by `db pull` into the baseline.
- `.gitignore`: `supabase init` writes `supabase/.gitignore` (ignores `.branches`,
  `.temp`). No secrets land in the repo — the access token / DB password stay in the
  CLI's own config.
- From here on, **all schema changes go through `supabase migration new` + `db push`**,
  never the SQL editor.

## Architecture

- **All handlers and services stay sync `def`** (matches every existing router).
  FastAPI runs sync endpoints and sync `BackgroundTasks` in its threadpool, so the
  blocking CPU work (whisper, librosa) never stalls the event loop.
- **HTTP to OpenRouter via sync `httpx.Client`** — matches `auth.py`'s sync
  `httpx.get`.
- **One in-memory decode** (`decode_audio` → ndarray), reused by whisper and librosa.
  Only the original webm is uploaded to Storage; the decoded array is transient.
- **faster-whisper model is a lazily-loaded module-level singleton** (first call
  ~10s + one-time model download; the session sits in `processing` meanwhile, which
  the frontend already handles).
- New code under `server/services/` (new package) — one file per pipeline stage,
  keeping each small and independently testable.

### Request / background flow

```
POST /api/sessions/voice-acting  (multipart: audio, scenario_id)
  1. read UploadFile bytes; look up scenario row (404 if missing)
  2. session_id = uuid4()
  3. upload webm → recordings/{user_id}/{session_id}.webm
  4. insert sessions row: status='processing', audio_path set, transcript/feedback null
  5. background_tasks.add_task(run_pipeline, session_id, audio_bytes, scenario, profile)
  6. return {session_id}                      ← client navigates to /sessions/:id/feedback

run_pipeline (background):
  audio = load_audio(audio_bytes)            # decode_audio(BytesIO) → 16kHz mono f32 ndarray
  transcript = transcribe(audio)             # {text, words:[{word,start,end}]}
  prosody = analyze(audio)                   # {duration, pitch_*, tempo, rms_*}
  fillers = count_fillers(transcript["words"])
  feedback = generate_feedback(profile, scenario, transcript, prosody, fillers)
  update sessions row: status='complete', transcript, prosody_data, feedback
  # any exception → update row: status='failed', error_message=str(e)
```

## Phase breakdown (each phase = one commit, independently testable)

### Phase 1 — Config + models
- `server/config.py`: add `whisper_model: str = "base"`,
  `openrouter_base_url: str = "https://openrouter.ai/api/v1"`.
- `server/models.py`: add `TranscriptWord {word:str, start:float, end:float}`,
  `Transcript {text:str, words:list[TranscriptWord]}`. Add `Field(ge=1, le=5)` to
  `FeedbackDimension.score` (currently just a `# 1-5` comment) so LLM output is
  actually validated. `Feedback` already exists and is correct.
- Verify: `uv run python -c "import config, models"`.

### Phase 2 — Audio load service + test fixture
- `server/services/__init__.py` (empty), `server/services/audio.py`:
  ```python
  import io
  from faster_whisper.audio import decode_audio
  def load_audio(webm_bytes: bytes):
      """webm/opus bytes → float32 mono ndarray @ 16 kHz (PyAV, no system ffmpeg)."""
      return decode_audio(io.BytesIO(webm_bytes))
  ```
  Shared input for transcription + prosody, and the one place documenting the
  "16 kHz mono float32" contract.
- Record ~15s of a real scenario script in the browser, save the blob as
  `server/tests/fixtures/sample.webm` (committed) — every downstream test needs it.
- Verify: `test_audio.py` — `load_audio(fixture_bytes)` returns a 1-D float32 ndarray,
  `len(arr) / 16000` ≈ known clip length.

### Phase 3 — Transcription service
- `server/services/transcription.py`: module-level `_model = None`;
  `_get_model()` lazily does `WhisperModel(settings.whisper_model, device="cpu",
  compute_type="int8")`. `transcribe(audio) -> Transcript` — takes the ndarray from
  `load_audio`, `model.transcribe(audio, word_timestamps=True, language="en")`
  (ndarray is used as-is, no re-decode), flatten segments → full `text` +
  `words:[{word,start,end}]` (strip the leading space faster-whisper puts on each
  word; round times to 2 dp to match the frontend).
- Verify: `test_transcription.py` on the fixture — assert non-empty `text`, `words`
  list with non-decreasing `start` times, all `end >= start`.

### Phase 4 — Prosody service
- `server/services/prosody.py`: `analyze(audio) -> dict` →
  `{duration, pitch_mean, pitch_std, pitch_range, tempo, rms_mean, rms_std}`.
  Takes the ndarray directly — no `librosa.load`. Pitch via
  `librosa.pyin(audio, sr=16000, fmin=65, fmax=400)` (drop NaN/unvoiced frames before
  mean/std/range); tempo via `librosa.beat.beat_track(y=audio, sr=16000)`; RMS via
  `librosa.feature.rms(y=audio)`; `duration = len(audio) / 16000`. Return plain
  `float(...)`, never numpy scalars, so it's JSON-serializable for the jsonb column;
  if pitch is fully unvoiced, return `0.0` for the pitch fields rather than NaN.
- Verify: `test_prosody.py` on the fixture — all keys present, `duration` within ~10%
  of the known length, no NaN/None in the dict.

### Phase 5 — Filler-word detector
- `server/services/fillers.py`: `SINGLE = {"um","uh","like","basically","actually",
  "literally","right","so"}`, `DOUBLE = {("you","know")}`.
  `count_fillers(words: list[dict]) -> int` — lowercase, strip surrounding
  punctuation from each `word`, count singles + adjacent-pair matches.
- Verify: `test_fillers.py` — `assert count_fillers(mk("So, um, you know, like, done.")) == 4`.

### Phase 6 — Feedback service (OpenRouter)
- `server/services/feedback.py`:
  - `SYSTEM_PROMPT` constant. **Expected to be iterated** — start with these rules,
    tune against real output:
    - Coaching tone, never evaluative; every point anchored to a timestamp or quoted
      phrase; concrete fixes in `original → suggested` form (PLAN.md:203–209).
    - Scores 1–5 (3 = competent, 5 = exceptional); **max 2 strengths, max 3 growth
      areas**; output **only** JSON matching the schema.
    - **Rubric scoring uses ONLY the scenario's listed dimensions** — hard rule, no
      scoring or penalizing anything outside that list.
    - **The performer's onboarding goals shape the narrative, not the scores.** In the
      `summary` and `growth_areas`, where a stated goal bears on this take, address it
      by name and point to the moment it showed up (or didn't). Where a goal is
      orthogonal to what this scenario exercises, ignore it — don't force a connection,
      don't treat its absence as a fault. Goals and dimensions may not align; that's
      expected and fine.
    - `subtypes` / `experience_level` calibrate register and what counts as a growth
      edge — not the numeric scores.
  - `_build_user_message(profile, scenario, transcript, prosody, filler_count)` — one
    string with labeled sections: performer subtypes / experience / **goals (verbatim
    freeform string from onboarding)**; scenario title / context / script; **the exact
    list of dimensions to score**; full transcript text; full word list with timestamps
    (JSON); prosody dict; filler count.
  - `generate_feedback(...) -> Feedback` — POST to
    `{openrouter_base_url}/chat/completions` with sync `httpx.Client` (60s timeout),
    `Authorization: Bearer {openrouter_api_key}`, `response_format={"type":
    "json_object"}`, `messages=[system, user]`. Parse `choices[0].message.content`
    with `Feedback.model_validate_json`. **On any error (HTTP, JSON, validation): retry
    once with `openrouter_fallback_model`.** If the fallback also fails, raise — the
    orchestrator turns that into `status='failed'`.
- Verify: `test_feedback.py` (hits the live free model, may be flaky) — feed a canned
  transcript+scenario, assert a valid `Feedback` back with `len(strengths) <= 2`,
  `len(growth_areas) <= 3`, and every `dimensions[].dimension` in the scenario's set.

### Phase 7 — Sessions router (orchestration + reads)
- `server/routers/sessions.py` — replace all three stubs:
  - `POST /voice-acting` — `audio: UploadFile`, `scenario_id: str = Form(...)`,
    `background_tasks: BackgroundTasks`, `user = Depends(get_current_user)`. Does steps
    1–6 of the flow above. Fetch the performer's `voice_acting_profile` from `profiles`
    in the request (not the background task) so a DB blip surfaces as a 4xx/5xx the
    client sees. Returns `{"session_id": ...}`.
  - `run_pipeline(...)` module-level function (the background task). Wraps the whole
    body in try/except; on exception does
    `supabase.table("sessions").update({"status":"failed","error_message":str(e)[:500]})`.
  - `GET /` — `select` user's sessions, newest first; shape each to the frontend
    `SessionSummary`: `{id, scenario_title, mode, status, created_at, feedback_summary}`.
    `scenario_title` needs a join — use PostgREST embedding
    (`.select("id,mode,status,created_at,feedback,scenarios(title)")`) and flatten, or
    a second query mapping `scenario_id → title`. `feedback_summary` =
    `feedback["summary"]` when `status=='complete'` else `null`.
  - `GET /{session_id}` — one row scoped to `user_id`; 404 if missing/not theirs.
    Return the frontend `SessionDetail` shape: `{id, status, mode, scenario:
    {id,title,context,dimensions}, transcript, feedback, error_message, created_at}`.
    Needs the scenario row joined/fetched.
- Verify: `uv run fastapi dev main.py`, then real recording through the browser (Phase
  9). Interim: `curl -F audio=@fixture.webm -F scenario_id=<real id> -H "Authorization:
  Bearer <token>" localhost:8000/api/sessions/voice-acting` then poll
  `GET /api/sessions/{id}`.

### Phase 8 — Frontend swap
- New `client/src/lib/sessionsApi.ts`: `fetchSessions()` and `fetchSessionDetail(id)`
  — real `fetch` with the Supabase bearer token (same pattern as
  `RecordingPage.tsx`), typed to the existing `SessionSummary` / `SessionDetail` in
  `client/src/types.ts` (unchanged — they were written to match this API).
- `DashboardPage.tsx` / `FeedbackPage.tsx`: swap the two mock imports for
  `sessionsApi`. Polling predicates, skeleton, tabs, failed-state — all unchanged.
- Delete `client/src/lib/mockSessions.ts`.
- `client/src/pages/RecordingPage.tsx`: submit already matches (`FormData` with
  `audio` + `scenario_id`, expects `{session_id}`) — verify only, no change expected.
- Verify: `npm run build` + `npm run lint` in `client/`.

### Phase 9 — End-to-end verification
- `uv run fastapi dev main.py` + `npm run dev` (first run downloads the whisper `base`
  model ~140 MB).
- Sign in → Dashboard (empty state) → New Session → pick "Commercial — Triple Smoke
  Stack" → record ~20s of the script → Submit.
- Expect: navigate to feedback page showing `FeedbackSkeleton`; within ~15–40s (first
  run + model load ~10s more) it polls to `complete` and renders `FeedbackView` with
  scenario-specific, timestamp-anchored feedback; Transcript tab shows timestamped
  word groups; Dashboard now lists the session.
- Failure path: temporarily point `openrouter_primary_model` /
  `openrouter_fallback_model` at a bad id → submit → session flips to `failed` →
  FeedbackPage shows the apology screen + "Try Recording Again".
- Confirm in Supabase console: `sessions` row with populated `transcript`,
  `prosody_data`, `feedback`; webm object at `recordings/{user_id}/{session_id}.webm`.

## Files

| File | Change |
|---|---|
| `supabase/config.toml` | new — from `supabase init` |
| `supabase/.gitignore` | new — from `supabase init` |
| `supabase/migrations/<ts>_remote_schema.sql` | new — baseline from `supabase db pull` |
| `supabase/migrations/<ts>_session_status.sql` | new — `sessions.status` + `error_message` |
| `server/config.py` | add `whisper_model`, `openrouter_base_url` |
| `server/models.py` | add `Transcript`/`TranscriptWord`; `Field(ge=1,le=5)` on score |
| `server/services/__init__.py` | new (empty) |
| `server/services/audio.py` | new — `load_audio` (faster-whisper `decode_audio` wrapper) |
| `server/services/transcription.py` | new — faster-whisper singleton + `transcribe` |
| `server/services/prosody.py` | new — librosa `analyze` |
| `server/services/fillers.py` | new — `count_fillers` |
| `server/services/feedback.py` | new — system prompt + OpenRouter call + validation |
| `server/routers/sessions.py` | rewrite — POST orchestration + background task + 2 GETs |
| `server/tests/` | new — fixture webm + one `test_*.py` per service |
| `client/src/lib/sessionsApi.ts` | new — real fetchers |
| `client/src/pages/DashboardPage.tsx` | swap mock import |
| `client/src/pages/FeedbackPage.tsx` | swap mock import |
| `client/src/lib/mockSessions.ts` | delete |
| `PLAN.md` / `CHANGES.md` / root `CLAUDE.md` | check off Task 6; add pipeline entry; drop the stale system-`ffmpeg`-required claim; document that schema changes now go through `supabase/migrations/` + `supabase db push` |

Reuse: `database.supabase` (service-role client), `auth.get_current_user` (JWT →
dict, id at `user["sub"]`), existing router conventions (sync `def`,
`raise HTTPException`, `response_model` on GETs), `client/src/types.ts` session types
(already API-shaped), `RecordingPage`'s bearer-token `fetch` pattern.

## Risks / notes

- **Free OpenRouter models + `response_format=json_object`** — `gpt-oss-120b:free` /
  `gemma-4-31b-it:free` may ignore the JSON directive or rate-limit. Mitigation: strict
  prompt + `model_validate_json` + one fallback attempt + `failed` status the UI
  already handles. If both models prove unreliable, revisit model choice (out of scope
  here).
- **faster-whisper first-run model download** (~140 MB) happens on the first real
  submit — that request's session just stays `processing` longer. Acceptable per
  PLAN.md; could add a startup warm-up later.
- **`decode_audio` forces a `gc.collect()` per call** (PyAV resampler leak workaround,
  baked into faster-whisper) — adds a few hundred ms per session. Negligible here.
- **`BackgroundTasks` runs in-process** — a server restart mid-pipeline leaves a stuck
  `processing` row. No reaper in MVP; the user can re-record.
- **`beat_track` tempo on speech** is a loose proxy (it's a music-beat estimator) —
  PLAN.md explicitly specifies it; keep as-is, the LLM also gets raw word timestamps.
- Keep `prosody_data` even though the frontend never displays it — it feeds the LLM
  prompt and is a specced column.
- **Docs drift:** PLAN.md Global Constraints and root `CLAUDE.md` both state system
  `ffmpeg` is required. With the `decode_audio` path it isn't (for this pipeline).
  Update both docs in the Phase 8/9 doc pass rather than leaving the stale claim.
- **`supabase db pull` baseline may be noisy** — it can emit storage/auth RLS policy
  statements and extension lines alongside the three tables. Commit it as-is (it
  reflects reality); don't hand-edit the baseline. If `db pull` errors on the hosted
  auth schema, `supabase db pull --schema public` narrows it to what we own.
- **CLI is a local dev tool, not a project dep** — not in `pyproject.toml`. A teammate
  without it can still read the `.sql` files; they only need it to `db push`.
