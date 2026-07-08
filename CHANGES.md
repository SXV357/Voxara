# Phase 1A Task 1 — Project Scaffolding

## Frontend (`client/`)

### Dependencies installed
- `react-router-dom`, `@supabase/supabase-js`, `lucide-react`, `tailwindcss`, `@tailwindcss/postcss`
- `clsx`, `tailwind-merge`, `class-variance-authority`, `@radix-ui/react-slot` (shadcn peer deps)

### Config changes
- `rsbuild.config.ts` — Tailwind PostCSS plugin, `@` alias → `./src`, dev proxy `/api` → `http://localhost:8000`
- `tsconfig.json` — added `paths: { "@/*": ["./src/*"] }`
- `components.json` — shadcn config (style: default, base: slate, CSS variables on)

### New files
- `src/globals.css` — Tailwind v4 `@import` + `@theme` block with all Voxara design tokens (studio-crimson, coaching-amber, canvas, studio-surface, studio-warm, ink, muted) mapped to shadcn CSS variables
- `src/lib/utils.ts` — `cn()` helper (`clsx` + `tailwind-merge`)
- `src/lib/supabase.ts` — Supabase browser client reading `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY`
- `src/contexts/AuthContext.tsx` — `AuthProvider` + `useAuth()` hook; tracks session via `onAuthStateChange`
- `src/components/ProtectedRoute.tsx` — shows loading state, redirects to `/login` if no session, renders `<Outlet />` if authenticated
- `src/components/ui/` — 11 shadcn components: `button`, `input`, `label`, `card`, `select`, `textarea`, `checkbox`, `badge`, `separator`, `tabs`, `progress`
- `src/pages/` — 7 stub pages: `LoginPage`, `DashboardPage`, `OnboardingVoiceActingPage`, `ScenarioSelectionPage`, `RecordingPage`, `FeedbackPage`, `ProfilePage`
- `.env.local` — template (fill with real values from Supabase dashboard → Settings → API)

### Modified files
- `src/App.tsx` — replaced placeholder with full router: `BrowserRouter` + `AuthProvider`, all 7 routes under `ProtectedRoute`, catch-all → `/dashboard`, hash check for `#design-preview`
- `src/index.tsx` — added `import './globals.css'`

### Deleted
- `src/App.css` — dead file (no longer imported); Plus Jakarta Sans is intentional per DESIGN.md

---

## Backend (`server/`)

### Dependencies added (uv)
`pydantic-settings`, `supabase`, `python-jose[cryptography]`, `python-multipart`, `httpx`, `faster-whisper`, `librosa`, `soundfile`

### New files
- `config.py` — `Settings` (pydantic-settings, reads `.env`): `supabase_url`, `supabase_service_role_key`, `supabase_jwt_secret`, `openrouter_api_key`, `openrouter_primary_model`, `openrouter_fallback_model`
- `database.py` — Supabase service-role client singleton
- `models.py` — core Pydantic models: `VoiceActingProfile`, `FeedbackDimension`, `GrowthArea`, `Feedback`
- `auth.py` — `get_current_user` FastAPI dependency; decodes Supabase JWT via `python-jose`, raises 401 on failure
- `routers/onboarding.py` — `POST /api/onboarding/voice-acting` → stub
- `routers/scenarios.py` — `GET /api/scenarios/voice-acting`, `GET /api/scenarios/{id}` → stubs
- `routers/sessions.py` — `POST /api/sessions/voice-acting`, `GET /api/sessions/`, `GET /api/sessions/{id}` → stubs
- `routers/profile.py` — `GET /api/profile/`, `PATCH /api/profile/voice-acting` → stubs
- `.env` — template (fill with real values from Supabase dashboard)

### Modified files
- `main.py` — FastAPI app with CORS (`http://localhost:3000`), all 4 routers mounted under `/api`

---

## Supabase — Manual Steps Required

### 1. Run in Supabase dashboard → SQL editor

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

### 2. Create Storage bucket

In Supabase → Storage: create a private bucket named `recordings`.

### 3. Fill in env files

`client/.env.local`:
```
PUBLIC_SUPABASE_URL=<from Supabase dashboard → Settings → API → Project URL>
PUBLIC_SUPABASE_ANON_KEY=<from Supabase dashboard → Settings → API → anon key>
```

`server/.env`:
```
SUPABASE_URL=<same project URL>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard → Settings → API → service_role key>
SUPABASE_JWT_SECRET=<from Supabase dashboard → Settings → API → JWT secret>
OPENROUTER_API_KEY=<from openrouter.ai>
OPENROUTER_PRIMARY_MODEL=anthropic/claude-sonnet-4-5
OPENROUTER_FALLBACK_MODEL=openai/gpt-4o-mini
```

---

## Verification

```bash
# Frontend — should build with 0 errors
cd client && npm run build

# Backend — should print 8
cd server && uv run python -c "from main import app; print(len(app.routes))"

# Start frontend (localhost:3000)
cd client && npm run dev

# Start backend (localhost:8000, docs at /docs)
cd server && uv run fastapi dev main.py
```

After env files are filled: frontend redirects unauthenticated users to `/login`; backend shows 4 stub routers at `localhost:8000/docs`.
