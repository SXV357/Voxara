# Voxara — Audio Recording + Feedback UI Breakdown

Scope: commit `de2b4c1` ("in app audio recording") + the current uncommitted working
tree (Feedback + Dashboard UI stub). Written 2026-08-28.

---

## Big picture — where these sit in the flow

```
ScenarioSelectionPage  →  RecordingPage  →  [POST /api/sessions/voice-acting]  →  FeedbackPage
     (pick scenario)       (record take)          (backend, Task 6, not built)      (see scores)
                                                                                        ↑
                                                              DashboardPage ────────────┘
                                                              (list past sessions, click in)
```

Two chunks of work:

1. **In-App Audio Recording** — committed as `de2b4c1`. The record screen. Real, works
   end-to-end up to the submit POST (which 4xx's until the backend pipeline exists).
2. **Feedback + Dashboard UI stub** — uncommitted working tree. The two screens that
   consume session/feedback data. Fully built UI, fed by a **mock data module** instead
   of a real API because `/api/sessions/*` doesn't exist yet.

They connect through: the `Scenario` / `Feedback` / `Session*` types in `types.ts`,
shared helpers in `lib/utils.ts`, shared CSS animation tokens in `globals.css`, and the
`/sessions/:sessionId/feedback` route.

---

## Part 1 — In-App Audio Recording (commit `de2b4c1`)

### Files

| File | New? | Role |
|---|---|---|
| `client/src/hooks/useAudioRecorder.ts` | new | Core state machine wrapping `getUserMedia` + `MediaRecorder` |
| `client/src/hooks/usePrefersReducedMotion.ts` | new | `matchMedia('(prefers-reduced-motion)')` as a reactive boolean |
| `client/src/components/RecordingStatusIndicator.tsx` | new | The pulsing dot + `M:SS` timer + screen-reader status |
| `client/src/components/WaveformCarousel.tsx` | new | Live mic-level bars (Web Audio `AnalyserNode`) |
| `client/src/pages/RecordingPage.tsx` | rewrite (stub → 305 lines) | The two-column record screen |
| `client/src/lib/utils.ts` | edit | Added `humanizeDimension()`, `formatElapsed()` |
| `client/src/components/ScenarioCard.tsx` | edit | Removed its private `humanizeDimension`, imports the shared one |
| `client/src/types.ts` | edit | Added `Scenario` (= `ScenarioSummary` + `script`) |
| `client/src/globals.css` | edit | `recording-pulse` keyframes + `--animate-recording-pulse` token |
| `CHANGES.md` / `PLAN.md` / `DESIGN.md` / `PRODUCT.md` | edit | Doc updates (Task 5 done, waveform exception, desktop-only constraint) |
| `client/lint.txt` | deleted | Stray file removed |

### `useAudioRecorder` — the state machine

States: `idle → recording ⇄ paused → stopped`.

Exposes: `status`, `error` (`permission-denied` / `no-device` / `unsupported` /
`unknown`), `elapsedMs`, `stream` (raw `MediaStream`), `audioBlob`, `audioUrl`, and
`start` / `pause` / `resume` / `stop` / `reset`.

Key mechanics:

- **`start()`** — calls `getUserMedia({audio:true})`, picks `audio/webm` if
  `MediaRecorder.isTypeSupported`, wires `ondataavailable` to push chunks into a ref,
  `onstop` to assemble a `Blob` + `URL.createObjectURL` + stop tracks. Catches
  `NotAllowedError` / `NotFoundError` → typed error.
- **Timer** — a `setInterval` (100ms) runs only while `status === 'recording'`,
  computing `Date.now() - startTimeRef`. `resume()` shoves `startTimeRef` **forward** by
  the paused duration, so paused time is excluded without tracking segments.
- **`pause` / `resume`** — native `MediaRecorder.pause()` / `.resume()`, no manual chunk
  splicing.
- **Cleanup** — unmount effect stops any live tracks so the mic light doesn't stay on.

### `WaveformCarousel` — the "yes, the mic hears you" meter

- Takes `stream` + `active` props. Effect 1 builds its own `AudioContext` +
  `MediaStreamSource` + `AnalyserNode` **off the same stream** the recorder uses (one
  `getUserMedia` call total). Never connects to `audioCtx.destination` → no echo.
- Effect 2 runs a `requestAnimationFrame` loop: reads `getByteTimeDomainData`, computes
  RMS per frame, pushes into a fixed 56-slot ring buffer, and writes each value directly
  to a `<div>`'s `style.height` **via refs — bypassing React re-render** every frame.
- DOM bars, not `<canvas>` — deliberate: canvas 2D has flaky OKLCH color support and
  nothing else in the codebase uses canvas. Colors stay plain Tailwind classes.
- `prefers-reduced-motion` → renders static "Capturing audio…" text instead.
- This is a **named, documented exception** to DESIGN.md's "one continuous animation"
  rule (see DESIGN.md Recording State Indicator). Gated strictly to
  `status === 'recording'` — freezes on pause, gone on stop.

### `RecordingPage` — layout & data

- **Left column** (resizable, 380–480px, pointer-drag divider): scenario `title`,
  dimension `Badge`s (`humanizeDimension`), `Your goal: {goals}` line, `context`,
  `script` in a surface card.
- **Right column**: `RecordingStatusIndicator`, `WaveformCarousel` (only when
  recording/paused), and a button set that swaps by status — `Start` / `Pause`+`Stop` /
  `Resume`+`Stop` / (`<audio controls>` + `Re-record`+`Submit for Feedback`).
- **Two data fetches on mount**:
  1. `GET /api/scenarios/:scenarioId` with the Supabase bearer token → `Scenario`.
     404 → "doesn't exist" screen; other non-OK → error screen.
  2. Direct Supabase read: `profiles.voice_acting_profile.goals` for the current user
     (same pattern as `ScenarioSelectionPage`'s onboarding guard). Goals shown
     **verbatim, unfiltered** — relevance filtering would need an LLM call; the backend
     feedback prompt already weights profile + scenario together server-side.
- **Submit**: builds `FormData` (`audio` blob as `recording.webm` + `scenario_id`),
  `POST /api/sessions/voice-acting`, on `{session_id}` →
  `navigate('/sessions/:session_id/feedback')`. Non-OK → inline "try again" (expected
  until backend Task 6). "processing may take 20–40 seconds" note while submitting.
- **Desktop-only** — new explicit constraint in PLAN.md + PRODUCT.md, because this is
  the app's first genuinely complex 2-column layout.

### Backend doc notes (in CLAUDE.md — part of the uncommitted set, but recording-related)

- Server needs system `ffmpeg` on PATH — not a Python dep. `librosa` falls back to it
  via `audioread` for webm/opus because `soundfile` / libsndfile **can't read webm/opus
  at all**. So a raw browser recording always hits the ffmpeg path.

---

## Part 2 — Feedback + Dashboard UI stub (uncommitted)

### Files

| File | New? | Role |
|---|---|---|
| `client/src/lib/mockSessions.ts` | new | Fake `/api/sessions/*` — in-memory fixtures, fake latency, processing→complete transition |
| `client/src/hooks/usePolling.ts` | new | Generic `setTimeout`-chain poller that stops when `shouldContinue(data)` is false |
| `client/src/components/DimensionPips.tsx` | new | The 5-pip score bar (DESIGN.md's central feedback visual) |
| `client/src/components/FeedbackView.tsx` | new | The real feedback layout: summary, dimension scores + rationale, strengths, growth areas, pronunciation notes |
| `client/src/components/FeedbackSkeleton.tsx` | new | Same shape as `FeedbackView`, placeholder copy, `score={0}` pips, while processing |
| `client/src/components/TranscriptView.tsx` | new | Groups `words[]` into 12-word chunks with `M:SS` timestamps |
| `client/src/components/SessionRow.tsx` | new | One dashboard row: title, status badge, feedback-summary preview, mode · date |
| `client/src/pages/FeedbackPage.tsx` | rewrite (stub → 97 lines) | Feedback/Transcript tabs; failed-state screen |
| `client/src/pages/DashboardPage.tsx` | rewrite (stub → 47 lines) | "Your Sessions" list / empty state |
| `client/src/components/Sidebar.tsx` | edit | Added a Dashboard nav link (was no way to reach `/dashboard` from the UI) |
| `client/src/types.ts` | edit | Added `Feedback`, `FeedbackDimension`, `GrowthArea`, `Transcript`, `TranscriptWord`, `SessionStatus`, `SessionSummary`, `SessionDetail` |
| `client/src/globals.css` | edit | `fade-in` keyframes + `--animate-fade-in` token (skeleton entrance) |
| `CLAUDE.md` | edit | ffmpeg / soundfile backend notes (see Part 1) |

### `mockSessions.ts` — the fake backend

Why it exists: `/api/sessions/*` isn't built (backend Task 6). This module lets both
pages be built and reviewed against realistic data.

- Module-level `mockSessions` array with three fixtures: `session-processing`,
  `session-complete` (full realistic `Feedback` + word-timed `Transcript` for the
  "Triple Smoke Stack" commercial), `session-failed` (with an OpenRouter 503
  `error_message`).
- `resolveStatus()` / `tick()` — the `processing` fixture auto-flips to `complete`
  **6 seconds after first fetch**, so the polling transition is actually visible in the
  browser.
- `fetchMockSessions()` → `SessionSummary[]` (sorted newest first).
  `fetchMockSessionDetail(id)` → `SessionDetail`, throws if not found.
- Both add ~300ms fake latency.
- Docstring says: swap these two functions for real `fetch('/api/sessions/...')` and
  **the page components don't change**.

### `usePolling` — shared by both pages

```
usePolling(fetcher, intervalMs, shouldContinue) → { data, error }
```

- `setTimeout` chain, never overlapping requests. After each successful fetch, if
  `shouldContinue(data)` is false it **stops** — so once a session is
  `complete` / `failed`, polling ends.
- `fetcher` and `shouldContinue` must be referentially stable (they're effect deps) →
  pages wrap them in `useCallback`.
- Errors don't stop the loop (keeps retrying), they just surface on `error`.

### `DashboardPage`

- `usePolling(fetchMockSessions, 5000, hasProcessingSession)` — polls every 5s only
  while some session is still processing.
- `data === null` → render nothing (first load). `[]` → empty state card with "New
  Session". Else → surface card with `divide-y` rows of `SessionRow`, each `onClick` →
  `/sessions/:id/feedback`.

### `FeedbackPage`

- Reads `:sessionId` from route.
  `usePolling(fetchMockSessionDetail(sessionId), 3000, isProcessing)` — 3s poll while
  processing.
- Header: `sessionData?.scenario.title ?? 'Your Session'` + "New Session" button.
- **Failed** → dedicated apology screen, "Try Recording Again" →
  `navigate('/voice-acting/record/:scenarioId')` (back to same scenario's record page —
  deliberate friction choice, keeps them from re-picking).
- **Otherwise** → `Tabs` (Feedback / Transcript):
  - Feedback tab: `complete` + `feedback` present → `<FeedbackView>`, else
    `<FeedbackSkeleton dimensions={scenario.dimensions} fadeIn={!prefersReducedMotion}>`.
  - Transcript tab: `complete` + `transcript` → `<TranscriptView>`, else placeholder
    line.

### `DimensionPips` / `FeedbackView` / `FeedbackSkeleton`

- `DimensionPips` is the DESIGN.md-mandated score visual: 5 fixed pips, first `score`
  filled Studio Crimson, rest bordered surface. `role="img"` with `Score N out of 5`
  label. No alternative score viz anywhere — that's a design rule.
- `FeedbackSkeleton` mirrors `FeedbackView`'s section structure exactly (Summary /
  Dimension Scores / Strengths / Growth Areas) so there's no layout jump when data lands
  — just `score={0}` pips and "will show up here" copy. `animate-fade-in` on entrance.

---

## Shared glue between the two parts

| Thing | Used by |
|---|---|
| `humanizeDimension()` in `lib/utils.ts` (`pitch_variance` → `Pitch Variance`) | `ScenarioCard`, `RecordingPage`, `SessionRow`, `FeedbackView`, `FeedbackSkeleton` |
| `formatElapsed()` / timestamp formatters | recording timer, transcript timestamps (separate impls, same `M:SS` shape) |
| `usePrefersReducedMotion` | `RecordingStatusIndicator`, `WaveformCarousel`, `FeedbackPage` (skeleton fade) |
| `globals.css` animation tokens (`--animate-recording-pulse`, `--animate-fade-in`) | pulse dot; skeleton |
| `types.ts` — `Scenario`, `Feedback`, `SessionDetail`, `SessionStatus` | recording fetch; feedback/dashboard rendering + mock |
| Route `/sessions/:sessionId/feedback` | RecordingPage submit target; DashboardPage row click target; FeedbackPage itself |
| Sidebar Dashboard link | makes `/dashboard` reachable (previously orphaned route) |

---

## Seams — what's real vs. fake, what changes when the backend lands

- **Real & working now:** the whole record screen (mic, waveform, pause/resume,
  playback), the scenario `GET`, the goals Supabase read.
- **Fake now:** everything session/feedback. `mockSessions.ts` is the only fake layer —
  swap `fetchMockSessions` / `fetchMockSessionDetail` for real `fetch()` calls and the
  pages, hooks, components, and types are unchanged. The mock's `SessionDetail` /
  `SessionSummary` shapes are the contract the backend must match.
- **Known loose end:** `RecordingPage` submit navigates to
  `/sessions/{real_session_id}/feedback`, but `fetchMockSessionDetail` only knows the 3
  hard-coded fixture ids → for a genuinely submitted recording it throws, `usePolling`
  keeps the error, `data` stays `null`, and `FeedbackPage` shows "Your Session" +
  skeleton forever. Expected until the backend exists; the submit POST 4xx's before that
  point anyway.
- **`useAudioRecorder` still has no way to expose recording to `FeedbackPage`** — the
  blob is uploaded and discarded client-side; playback of a past take will come from the
  backend.
