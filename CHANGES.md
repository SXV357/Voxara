# Changes

Organized by area, not by session. Each item explains what changed and why, in plain terms. Manual steps you still need to run are pulled into their own section at the bottom.

## Frontend scaffolding (`client/`)

**Stack:** React Router v7, Tailwind v4, shadcn/ui, Supabase JS client, lucide-react icons.

- `src/globals.css` — design tokens (colors, radius, type scale, shadows) live here as Tailwind `@theme` variables, matching `DESIGN.md`. Anything visual should pull from these rather than hardcoding a value.
- `src/lib/supabase.ts` — the Supabase browser client. Sessions persist in `localStorage` by default (this matters — see Auth section below).
- `src/contexts/AuthContext.tsx` — `useAuth()` hook exposing `session`/`user`/`loading`, tracked via Supabase's `onAuthStateChange`.
- `src/components/ProtectedRoute.tsx` — redirects to `/login` if there's no session; wraps every authenticated page.
- `src/components/DashboardLayout.tsx` + `src/components/Sidebar.tsx` — the shell (sidebar + scrollable content) for every authenticated page. Applied once as a parent route in `App.tsx` rather than imported into each page individually — one place to change the shell later, and the six page files stay untouched.
- `src/pages/` — `LoginPage` (built out, see Auth below); `OnboardingVoiceActingPage` and `ScenarioSelectionPage` (built out, see Voice Acting Onboarding below); `DashboardPage`, `RecordingPage`, `FeedbackPage`, `ProfilePage` (still stubs).
- `src/components/ui/` — shadcn primitives (`button`, `input`, `label`, `card`, `select`, `textarea`, `checkbox`, `badge`, `separator`, `tabs`, `progress`).

## Backend scaffolding (`server/`)

**Stack:** FastAPI, Supabase Python client, `python-jose` for JWT verification, faster-whisper + librosa (audio analysis, not wired up yet).

- `config.py` — typed settings read from `.env`.
- `database.py` — Supabase service-role client (server-side, full access — never expose this key to the frontend).
- `auth.py` — `get_current_user` dependency. Verifies the JWT Supabase issues against its public key set (ES256), rather than a shared secret — this is why it calls `/.well-known/jwks.json` instead of just checking a password-like secret. The key set is cached (`@lru_cache`) since it only changes on key rotation, not per-request.
- `models.py` — Pydantic models for the feedback/profile data shapes the app will produce later.
- `routers/*.py` — five routers: `scenarios`, `sessions`, `profile` (still stub endpoints returning `{"status": "stub"}`); `onboarding` (real — `POST /onboarding/voice-acting`, see Voice Acting Onboarding section below); and `auth` (real — `POST /auth/check-provider`, see Auth section below).
- `main.py` — mounts the routers under `/api`, CORS allowed for `localhost:3000`.

## Design system fixes

A few gaps between `DESIGN.md` (the spec) and the actual components, found and fixed as the login page got built out:

| What | Why it was wrong | Fix |
|---|---|---|
| Type scale (Display/Headline/Title/Body/Label) | Colors and radius were already tokens in `globals.css`; type sizes were described in `DESIGN.md` but never turned into usable classes, so pages fell back to generic defaults | Added `--text-display` etc. to `@theme` — same pattern as the existing color tokens |
| Shadow vocabulary (Float/Lift) | Same issue — named in the doc, never implemented | Added `--shadow-float`/`--shadow-lift` to `@theme` |
| `Label` font size | Used 14px; spec calls for 12px on form labels specifically | Changed to the `text-label` token |
| Input/Textarea/Select focus style | Used a glowing focus ring; spec explicitly says focus should just shift the border to Ink, no glow | Swapped the ring for a border-color transition |
| `Card` had a border + shadow at rest | Spec says static cards get *no* border/shadow — boundary comes from background-color contrast alone | Removed both from the shared `Card` component |
| Button height was 40px | Below the 44px touch-target minimum | Bumped default button size to 44px |
| Login card looked like it was floating | Removing `Card`'s border/shadow (above) assumed there's always a neighboring surface for contrast. On the login screen the card is alone on an empty background, so there's nothing to contrast against | Applied the `shadow-lift` token — already defined for "overlaid panel" cases — to just this one card, not the shared component. Every other card in the app stays flat as intended. |
| `CardTitle` had a hardcoded 24px default | It happened to get overridden correctly, but only by accident of CSS rule ordering, not by anything guaranteed | Removed the hardcoded size; callers now set their own |
| shadcn compat tokens (`bg-popover`, `bg-primary`, `bg-card`, `bg-accent`, `text-*-foreground`, etc.) silently didn't apply anywhere in the app | Tailwind v4 only turns a `@theme` variable into a utility class if it's under a recognized namespace (`--color-*`, `--text-*`, `--radius-*`, ...). The shadcn variable block was copied in with bare names (`--background`, `--primary`, `--popover`, ...) — valid CSS custom properties, but invisible to Tailwind's utility generator. Every component leaning on the default shadcn color classes (Button's `bg-primary`, Select's `bg-popover`/`bg-accent`, Card's `bg-card`) rendered with no color at all. Caught when the Select dropdown on the onboarding page rendered fully transparent (dropdown text overlapping page content) and the Continue button rendered as bare unstyled text | Added `--color-*` aliases (`--color-background: var(--background)`, etc.) for `background/foreground/card/popover/primary/secondary/accent/destructive` and their `-foreground` pairs. Left bare `--muted` unaliased — it collides with the existing bespoke `--color-muted` (different value, already used as `text-muted`) — so `bg-muted` (only used by `SelectSeparator`, not currently in use) stays a no-op |

## Auth (login/signup page)

Current behavior, plainly:

- **Sign in** with email/password → straight to `/dashboard`.
- **Sign up** with a new email → Supabase sends a confirmation email; the page shows "check your email" instead of pretending you're logged in. Clicking the email link *is* the sign-in step (Supabase redirects back with a token the client picks up automatically) — that part is standard Supabase behavior, not something we built.
- **Sign up** with an email that's already registered → shown "this email is already registered, try signing in" (Supabase itself stays silent about this to prevent account enumeration; we detect it client-side via `data.user.identities.length === 0`, which is Supabase's documented signal for it).
- **Continue with Google** → Supabase OAuth redirect, lands on `/dashboard`. Needs the Google provider configured in the Supabase dashboard (see Manual steps).
- Password field has an eye icon to toggle visibility.
- Visiting `/login` while already signed in redirects straight to `/dashboard` instead of showing the form again (this was a real gap — `/login` sat outside `ProtectedRoute` with no guard of its own, and since Supabase persists sessions in `localStorage`, an old session made the page still fully usable).

One accessibility/contrast note worth keeping in mind for future info/status messages: the amber design token (`coaching-amber`) looks good as an accent/badge color but fails text-contrast requirements at small sizes (~2.5:1, needs 4.5:1) — use `text-muted` for any info-style text instead.

### Cross-provider sign-in detection

**What:** Added `POST /api/auth/check-provider` (`server/routers/auth.py`), called from `LoginPage.tsx` when a password sign-in fails. If the account was created via Google OAuth only, the generic "Invalid login credentials" error is swapped for "This account uses Google. Sign in with Google below."

**Why:** Users who originally signed up via Google naturally try their Gmail password on the raw email/password form later. Supabase rejects it with the same generic error as a plain wrong password (no password was ever set on that account), which reads as a bug rather than a nudge toward the right button.

**Method chosen vs. alternatives:**
- Checks only after a failed password attempt, not on every keystroke/blur (Slack/Notion-style proactive check) — avoids a network call on every email typed; costs one extra request only in the failure case.
- Lookup happens server-side via the existing service-role Supabase client, not client-side — the anon-key client has no access to other users' provider/identity data by design (prevents enumeration from arbitrary JS).
- Reads `app_metadata.providers` instead of `identities` — see quirks below.
- Narrow enumeration surface: response only distinguishes "Google-only account" from everything else (no account, or account with a password) — doesn't reveal general account existence, since non-Google-only cases all fall through to the same generic message.

### Auth quirks / gotchas

- `supabase.auth.admin.list_users()` does **not** populate `identities` on the users it returns (trimmed for the list endpoint) — read `app_metadata.providers` instead. `get_user_by_id()` does return `identities` if ever needed.
- No email filter on `list_users()` in the installed `supabase-py`/gotrue version — `check-provider` scans one page (`per_page=1000`) and matches in Python. Fine at current scale; would need a Postgres RPC or paginated loop past ~1000 users.
- OAuth-created accounts have no password set. Any password typed on the raw email/password form — including the account's real Gmail password — is rejected with the same generic error as a wrong password on a normal account. Expected Supabase behavior, not a bug.
- "Sign in" vs "Sign up" buttons are cosmetic for OAuth — `signInWithOAuth` creates the account if it doesn't exist and signs in either way; no separate signup step.
- OAuth sign-in auto-links to an existing email/password account when the OAuth-provided email matches and is verified — same `auth.users` row gains a second identity, not a new user. This is Supabase's default (not gated behind manual linking).

### Known limitation: pre-hijacking via auto-link (not fixed, MVP-acceptable for now)

**What:** Attacker signs up raw email/password using a victim's real email + attacker-chosen password, before the victim ever uses the app. That row sits unverified (attacker has no inbox access, can't confirm, can't sign in). If the victim later signs up/in via Google OAuth with that same email, Supabase's default auto-link (`DetermineAccountLinking` in gotrue) finds the existing user row by matching email and links the Google identity to it rather than creating a new user — same mechanism as the line above, just triggered by someone other than the account's real owner. The email gets marked verified as part of that linking, which would also activate the attacker's dormant password for raw email/password sign-in going forward.

**Why not fixed:** MVP stage, low priority relative to current build effort; this is stock Supabase Auth behavior (not something `auth.py` controls), and exploiting it requires knowing the victim's email in advance and winning a race against their first login — not a trivial drive-by attack.

**Mitigation if revisited:** notify the user (email) whenever a new identity links to their account; or expire/purge unverified raw email/password signups after a short window so a planted row can't sit dormant waiting to be "rescued" by the victim's own OAuth login.

## Voice Acting Onboarding (Phase 1B, Task 3)

**What:** `POST /api/onboarding/voice-acting` (`server/routers/onboarding.py`) validates the request as `VoiceActingProfile` and writes it to `profiles.voice_acting_profile` for the calling user. `OnboardingVoiceActingPage` collects subtypes (multi-select checkboxes, at least one required), experience level (select), and goals (required freeform textarea), then POSTs to that endpoint and navigates to `/voice-acting/scenarios` on success. `ScenarioSelectionPage` now guards itself: on mount it reads `profiles.voice_acting_profile` for the current user directly via the Supabase browser client and redirects to onboarding if it's null.

**Why:** Onboarding data has to exist before a user can pick a scenario, since it will feed the LLM feedback prompt later. Gating at the scenario page (rather than gating navigation from the sidebar) means a returning user hitting the URL directly is still covered.

**Method chosen vs. alternatives:**
- The Supabase update in the onboarding route checks `result.data` and 500s if empty, rather than trusting a 200 from `.execute()`. This route runs under the service-role key (bypasses RLS — see `database.py`'s note on that tradeoff), so the `.eq("id", user_id)` filter is a manually-enforced safety boundary, not a redundant one; a silent zero-row update would look like success while writing nothing.
- The onboarding-guard on `ScenarioSelectionPage` reads Supabase directly from the browser client instead of adding real logic to the existing `GET /api/profile/` stub. That stub is reserved for Task 8's full profile page; building it out now for this narrower read would mean Task 8 either duplicates it or works around it. A direct client read is also safe here without extra app-level filtering — RLS on `profiles` already restricts reads to the caller's own row.
- This is the first authenticated `fetch()` call in the frontend (previously only `check-provider` existed, and that's unauthenticated) — the `Authorization: Bearer ${session.access_token}` header is attached inline in the submit handler rather than behind a new fetch-wrapper abstraction, since there's only the one call site.
- The redirect guard is a plain in-page `loading`/`needs-onboarding`/`ready` status, not a new reusable hook — `ProtectedRoute` only guards on synchronous session presence, and this async/data-dependent case doesn't yet have another consumer to justify extracting a shared pattern.

## Scenario Library (Phase 1B, Task 4)

**What:** `GET /api/scenarios/voice-acting` (`server/routers/scenarios.py`) returns the 4 curated scenario summaries (id, title, context, dimensions); `GET /api/scenarios/{id}` returns the full scenario including the script. `server/seed.py`'s `seed_scenarios()` clears existing `mode="voice_acting"` rows and re-inserts the 4 scenarios (Villain Monologue, Fast Food Commercial, Multi-Character Audiobook Dialogue, Nature Documentary Narration), and runs automatically via a FastAPI `lifespan` handler in `main.py` on every app startup. `ScenarioCard` renders title, truncated context, dimension badges, and a Select button; `ScenarioSelectionPage` fetches the list and renders a responsive grid, navigating to `/voice-acting/record/:scenarioId` on select.

**Why:** Scenario content needs to exist before the selection UI has anything to render, and it needs to be trivially re-runnable as scripts/dimensions get tuned pre-launch.

**Method chosen vs. alternatives:**
- Seeding runs on app startup (`lifespan`) instead of a manually-invoked `scripts/seed_scenarios.py`. A manual step is easy to forget after editing scenario copy; startup seeding guarantees the DB always matches the code without a separate command to remember. Tradeoff: every reload during local dev re-runs a delete+insert against Supabase — negligible cost at 4 rows, would need reconsidering if scenario count or seed cost grows.
- `GET /{scenario_id}` avoids `.single()` and instead checks `if not result.data` (same pattern as the onboarding route's update check) — `.single()` raises inside the postgrest client on zero rows, which is a less direct way to produce the 404 than just checking an empty list.

## Profile Page (pulled forward from Task 8)

**What:** `GET /api/profile/` (`server/routers/profile.py`) returns the full `profiles` row for the current user; `PATCH /api/profile/voice-acting` updates `voice_acting_profile` (reuses the existing `VoiceActingProfile` model — same shape as onboarding). `ProfilePage` shows the user's email (and name, if set) and an editable form pre-populated from `GET /api/profile/`, with a "Saved!" confirmation on `PATCH` success. `LoginPage`'s sign-up form now collects a "Full name" field; `Sidebar` shows a "Hi, {name}" greeting.

**Why:** Wanted Profile editable ahead of the sessions pipeline (originally bundled at the very end of Phase 1B in Task 8) rather than deferred, plus a name-based greeting somewhere in the app shell.

**Method chosen vs. alternatives:**
- Name is stored in Supabase Auth's `user_metadata` (via `signUp`'s `options.data.full_name`), not a new column on `profiles`. Google OAuth already populates `user_metadata.full_name`/`name` automatically, so this keeps both signup paths reading from the same place with zero schema change. Users who signed up before this change have no name — `Sidebar`/`ProfilePage` fall back to nothing shown / email only.
- Theatre profile editing is explicitly **not** built here — there's no Theatre onboarding flow yet to have ever written a `theatre_profile`, and PLAN.md's Global Constraints keep Theatre out of scope until voice acting E2E is validated. Building an edit form for a profile shape that's never created would be scope creep ahead of that gate.
- `GET /api/profile/` returns the full row (not scoped to just `voice_acting_profile`) since Task 8's original interface spec already defines it that way and `ProfilePage` needs `voice_acting_profile` specifically today — no extra endpoint needed later when other consumers show up.

## Verification

```bash
# Frontend — should build with 0 errors
cd client && npm run build

# Backend — should print 9
cd server && uv run python -c "from main import app; print(len(app.routes))"

cd client && npm run dev   # localhost:3000
cd server && uv run fastapi dev main.py   # localhost:8000, docs at /docs
```

Manual click-through of the auth flows above (sign up, confirm, duplicate email, Google, sign out, revisiting `/login` while logged in, cross-provider password attempts) completed — Phase 1A auth is E2E validated.
