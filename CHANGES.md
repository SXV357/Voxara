# Changes

Organized by area, not by session. Each item explains what changed and why, in plain terms. Manual steps you still need to run are pulled into their own section at the bottom.

## Frontend scaffolding (`client/`)

**Stack:** React Router v7, Tailwind v4, shadcn/ui, Supabase JS client, lucide-react icons.

- `src/globals.css` — design tokens (colors, radius, type scale, shadows) live here as Tailwind `@theme` variables, matching `DESIGN.md`. Anything visual should pull from these rather than hardcoding a value.
- `src/lib/supabase.ts` — the Supabase browser client. Sessions persist in `localStorage` by default (this matters — see Auth section below).
- `src/contexts/AuthContext.tsx` — `useAuth()` hook exposing `session`/`user`/`loading`, tracked via Supabase's `onAuthStateChange`.
- `src/components/ProtectedRoute.tsx` — redirects to `/login` if there's no session; wraps every authenticated page.
- `src/components/DashboardLayout.tsx` + `src/components/Sidebar.tsx` — the shell (sidebar + scrollable content) for every authenticated page. Applied once as a parent route in `App.tsx` rather than imported into each page individually — one place to change the shell later, and the six page files stay untouched.
- `src/pages/` — `LoginPage` (built out, see Auth below); `DashboardPage`, `OnboardingVoiceActingPage`, `ScenarioSelectionPage`, `RecordingPage`, `FeedbackPage`, `ProfilePage` (still stubs).
- `src/components/ui/` — shadcn primitives (`button`, `input`, `label`, `card`, `select`, `textarea`, `checkbox`, `badge`, `separator`, `tabs`, `progress`).

## Backend scaffolding (`server/`)

**Stack:** FastAPI, Supabase Python client, `python-jose` for JWT verification, faster-whisper + librosa (audio analysis, not wired up yet).

- `config.py` — typed settings read from `.env`.
- `database.py` — Supabase service-role client (server-side, full access — never expose this key to the frontend).
- `auth.py` — `get_current_user` dependency. Verifies the JWT Supabase issues against its public key set (ES256), rather than a shared secret — this is why it calls `/.well-known/jwks.json` instead of just checking a password-like secret. The key set is cached (`@lru_cache`) since it only changes on key rotation, not per-request.
- `models.py` — Pydantic models for the feedback/profile data shapes the app will produce later.
- `routers/*.py` — five routers: `onboarding`, `scenarios`, `sessions`, `profile` (still stub endpoints returning `{"status": "stub"}`), and `auth` (real — `POST /auth/check-provider`, see Auth section below).
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
