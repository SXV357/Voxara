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
- `routers/*.py` — four routers (`onboarding`, `scenarios`, `sessions`, `profile`), all still stub endpoints returning `{"status": "stub"}`.
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

## Manual steps still required (not code — you have to do these in the dashboards)

**1. Supabase SQL editor** — run once to create the schema:
```sql
-- profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  voice_acting_profile jsonb,
  theatre_profile jsonb,
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "own row" on public.profiles
  using (auth.uid() = id) with check (auth.uid() = id);

-- auto-insert profile row on signup (DB trigger — avoids race conditions on network drop)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- scenarios table
create table public.scenarios (
  id uuid primary key default gen_random_uuid(),
  mode text not null,
  title text not null,
  context text not null,
  script text not null,
  dimensions text[] not null,
  created_at timestamptz default now()
);
alter table public.scenarios enable row level security;
create policy "authenticated read" on public.scenarios
  for select using (auth.role() = 'authenticated');

-- sessions table
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scenario_id uuid not null references public.scenarios(id),
  mode text not null,
  audio_path text,
  transcript jsonb,
  prosody_data jsonb,
  feedback jsonb,
  created_at timestamptz default now()
);
alter table public.sessions enable row level security;
create policy "own rows" on public.sessions
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

**2. Supabase Storage** — create a private bucket named `recordings`.

**3. Google OAuth provider** — Supabase Dashboard → Authentication → Providers → Google. Needs a Google Cloud OAuth client ID/secret, and the Supabase callback URL registered in Google Cloud Console's authorized redirect URIs. The "Continue with Google" button won't work until this is filled in.

**4. Env files**

`client/.env.local`:
```
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
```

`server/.env`:
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=
OPENROUTER_PRIMARY_MODEL=openai/gpt-oss-120b:free
OPENROUTER_FALLBACK_MODEL=google/gemma-4-31b-it:free
```

## Verification

```bash
# Frontend — should build with 0 errors
cd client && npm run build

# Backend — should print 8
cd server && uv run python -c "from main import app; print(len(app.routes))"

cd client && npm run dev   # localhost:3000
cd server && uv run fastapi dev main.py   # localhost:8000, docs at /docs
```

Still outstanding (needs a human, not just a build check): full manual click-through of the auth flows above in a real browser — sign up, confirm, duplicate email, Google, sign out, revisiting `/login` while logged in.
