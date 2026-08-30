# Voxara

## Project Docs

- `PLAN.md` — ongoing implementation plan. Read before starting any non-trivial feature; it tracks architecture decisions, phase breakdown, and global constraints. Based on `PRD.md`
- `PRODUCT.md` — referenced by `/impeccable` commands.
- `DESIGN.md` — design system source of truth. All color tokens, typography, spacing, elevation, and component specs live here.
- `CHANGES.md` — changelog, organized by topic/area (not by session or date). After any non-trivial change, add or update the relevant topic section with:
  - **What** — brief, plain description of the change
  - **Why** — the problem or need driving it
  - **Method chosen vs. alternatives** — why this approach over the other options considered
  Keep entries concise — a few lines, not a full writeup. Quirks/gotchas discovered along the way (framework behavior, SDK surprises, platform defaults) belong in a terse, append-only "quirks" list under the relevant topic, separate from the change entries themselves.

## Frontend

All frontend code lives in `client/`. Commands run from `client/`.

### Commands

- `npm run dev` — start the dev server
- `npm run build` — build for production
- `npm run preview` — preview the production build locally

### Linting & Formatting

- `npm run lint` — run ESLint
- `npm run format` — run Prettier

### UI & Design

- All design tokens (colors, typography, spacing, elevation, radius, shadows) are defined in `DESIGN.md`. Do not invent values — check the doc first.
- For any UI implementation — layouts, components, states, motion — refer to `DESIGN.md` before writing code. It contains named rules, component specs, and the complete color palette with OKLCH values.
- For non-trivial UI work, use `/impeccable` commands to shape, craft, audit, or polish against the design system.
- The throwaway design preview lives at `client/src/DesignSystemPreview.tsx` and is accessible at `/#design-preview`. Use it to visually verify token changes.

### Docs

- Rsbuild: https://rsbuild.rs/llms.txt
- Rspack: https://rspack.rs/llms.txt

## Backend

All backend code lives in `server/`, managed with `uv` (not pip/poetry). Commands run from `server/`.

- Running the server (port 8000):
  - `uv run python main.py` — direct invocation
  - `uv run fastapi dev main.py` — uvicorn CLI, if preferred
- Env vars come from `server/.env` (Supabase URL/service-role key, OpenRouter keys — see `config.py`).
- **Schema/migrations:** the schema lives in `supabase/migrations/` (Supabase CLI). Apply changes with `supabase db push`; never hand-run SQL in the dashboard. The CLI is a local dev tool, not a Python dependency.
- **System `ffmpeg` is not required by the audio pipeline.** `server/services/audio.py` decodes browser webm/opus in-memory via faster-whisper's bundled PyAV (`decode_audio` → 16 kHz mono float32 ndarray); transcription and prosody both take that ndarray directly, so `librosa.load` / `audioread` is never hit. (ffmpeg is harmless to keep installed if it's already there.)

### Gotchas

- Auth verifies JWTs against Supabase's JWKS (ES256), cached forever per process — a signing-key rotation needs a backend restart.
- `seed_scenarios()` runs on every `lifespan` boot — now an upsert on the `(mode, title)` natural key (+ a prune of removed titles), not delete-then-insert, so scenario `id`s stay stable for the `sessions.scenario_id` FK.
- `soundfile`/libsndfile can't read webm/opus at all (any version). The pipeline sidesteps this entirely by never calling `librosa.load` — see the `decode_audio` note above.

## Behavioral Guidelines

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.
