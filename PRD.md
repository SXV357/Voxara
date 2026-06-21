# PRD: Voxara - A unified platform to empower the next generation of voice actors/actresses and theatre performers
**Version:** 0.1 (Draft)

**Author:** Shreyas Viswanathan 

**Last Updated:** Jun 20, 2026 

**Status:** In Progress

---

## 1. Problem Statement

There are several platforms that exist out there geared towards helping people work on their public speaking and pronunciation skills - some examples are Orai, Yoodli, ELSA Speak, and Speeko. 
- Orai is more geared towards professionals practicing presentations, pitches and speeches. It records ones audio and video and gives post-session feedback on pace, energy and facial expressions. The facial analysis component exists but underdeveloped.
- Yoodli is a much more sophisticated multimodal coaching platform covering verbal and visual elements of delivery. It's more enterprise focused than consumer, but is real-time capable and supports deep, structured feedback.
- ELSA Speak is more like Duolingo but for English pronunciation and has a lot of gamified components like conversation simulations with AI, tracking progress etc. 
- Speeko functions more as a course platform providing audio analysis.

While Yoodli for example allows one to choose from ready-made roleplays or even create roleplays, which would dictate how feedback is presented separate from how is it structured in general cases, the platform as a whole isn't designed for those in the fine arts space - more specifically theatre performers and voice artists.

When we talk about public speaking in general or communication in a workspace environment, there are a baseline set of things the above platforms optimize for in terms of how they provide feedback. Performance is alive and art is subjective. More so, he human embodied nature of this work means that this humanity needs to be supported and not replaced.

Those that are involved in this space currently don't have a means of effectively practicing between rehearsals. They may take acting or voice lessons with coaches for example, but there is still a need for them to work on their skills outside of that and more importantly be able to receive specific and actionable feedback.

## 2. Target Users

### Voice Acting
- **Primary:** Aspiring voice actors, students, hobbyists
- **Subtypes captured at onboarding:** Commercial, Audiobook, Character/Animation, Narration

### Theatre
- **Primary:** Student and adult performers, community theatre, drama school students

**Experience Level**: This tool will be able to support those who are starting off and those who also have some experience. This will be factored into the onboarding flow which will be used for the personalization aspect.

---

## 3. Design Constraints
> These are non-negotiables that scope the product and inform the LLM prompt design.

- Feedback must function as a **coach, not a judge** — expansive, not evaluative
- Feedback must be **specific and anchored to moments** in the recording, not generic
- Feedback must be **actionable** — every growth area comes with a suggested path forward
- **No singing / musical theatre** in MVP — deferred to v2
- **No blind upload** — every session has a defined context before analysis
- **No freeform session builder** in MVP — curated scenarios only
- **"Pick both modes" simultaneously is not supported** — one mode per session
- Listening & Reactive Presence (theatre) is **out of scope for MVP** — requires scene partner

---

## 4. App Structure (Tentative)

### Entry & Navigation
- User logs in → Dashboard that will contain the user's recordings that they can click into and view. There will be a navigation pane to the leftmost side with 2 options: **Voice Acting** and **Theatre**
- First time selecting a mode → triggers onboarding flow for that mode
- Returning user → goes directly to session selection
- There should also most likely be a place where the user can click and view their profile. This is a place where they could go and modify details they provided as part of the onboarding flows so the personalization is up-to-date.

### Onboarding Per Mode (first time only)
**Voice Acting onboarding captures (at the minimum):**
- Subtype: Commercial / Audiobook / Character & Animation / Narration
- Experience level
- Goals (e.g. reduce filler words, improve character differentiation, mic technique)

**Theatre onboarding captures (at the minimum):**
- Focus area: Singing has been deferred as more of a stretch goal so musical-adjacent as a focus area would be hard to capture. They could specify anything else like drama, comedy, villian-adjacent roles, etc
- Experience level
- Goals

> Onboarding data feeds directly into the LLM system prompt for all subsequent sessions — this is why it's worth building even for MVP

---

## 5. Session Flow

### Voice Acting Session
1. User selects a curated scenario (see Section 7)
2. User reads scenario context + script
3. User records audio (in-app) 
4. App processes recording
5. Feedback screen rendered potentially alongside the audio transcript with timestamps

### Theatre Session
1. User selects a curated scenario
2. User reads scenario context + script/prompt
3. User records video (in-app) — webcam + mic
4. App processes recording (audio + facial)
5. Feedback screen rendered potentially alongside the recorded video, including transcript with timestamps

---

## 6. Feedback Dimensions

### Voice Acting
| Dimension | Measurable? | Method |
|---|---|---|
| Clarity / Enunciation | Yes | Audio analysis |
| Pacing & Intentional Pausing | Yes | Audio analysis |
| Pitch Variance & Expressiveness | Yes | Audio analysis (prosody) |
| Breath Support & Consistency | Partially | Audio analysis (phrase-end drop-off) |
| Filler Words & Flow | Yes | Transcript |
| Character / Tonal Differentiation | No | LLM inference |
| Subtlety & Mic Awareness | No | LLM inference from prosody + transcript |

### Theatre
| Dimension | Measurable? | Method |
|---|---|---|
| Vocal Clarity & Projection | Yes | Audio analysis |
| Facial Expression Alignment | Partially | MediaPipe landmarks |
| Eye Contact / Audience Engagement | Partially | MediaPipe gaze estimation |
| Body Language & Gesture Confidence | Partially | MediaPipe pose |
| Emotional Intention & Delivery | No | LLM inference |
| ~~Listening & Reactive Presence~~ | ~~Out of scope~~ | — |

---

## 7. Curated Scenarios (MVP)

### Voice Acting (pick 3–5)
> Each scenario should surface different dimensions. Fill these in — you're defining the scripts.

| # | Scenario | Type | Primary Dimensions Targeted |
|---|---|---|---|
| 1 | Villain monologue | Character/Animation | Tonal/Character Differentiation, Pitch Variance & Expressiveness, Intentional Pausing |
| 2 | Fast Food Commercial | Commercial | Pacing, Energy/Pitch, Enunciation, Filler Words & Flow |
| 3 | Multi-character audiobook dialogue | Audiobook | Character Differentiation (voice switching), Breath support, Pacing over duration |
| 4 | Nature documentary narration | Narration | Breath support (long sustained phrases), Controlled/Intentional Pacing, Enunciation |
| 5 | [fill in] | | |

### Theatre (pick 3–5) - Will come to this
| # | Scenario | Type | Primary Dimensions Targeted |
|---|---|---|---|
| 1 | [e.g. dramatic monologue] | Drama | Emotional Intention, Facial Expression |
| 2 | [e.g. comedic scene excerpt] | Comedy | Pacing, Expression Alignment |
| 3 | [e.g. audition-style cold read] | General | Eye Contact, Delivery |
| 4 | [fill in] | | |
| 5 | [fill in] | | |

---

## 8. Feedback Format

> Reference: Yoodli's structure is the benchmark — rubric scores for orientation, then specific anchored feedback per dimension, then growth areas with original vs. alternative phrasing

### Structure per session
- **Summary** — 2-3 sentence overall read, coaching tone
- **Dimension Scores** — scored rubric (e.g. 1–5) per dimension with a 1-2 sentence rationale
- **Strengths** — 1-2 specific things done well, anchored to a moment in the recording
- **Growth Areas** — max 3, each with:
  - What the issue is
  - Where it happened (timestamp or quote from transcript)
  - A concrete suggested adjustment (original → alternative format where applicable)
- **[Voice Acting only] Pronunciation / Mic Notes** — if applicable
- **[Theatre only] Visual Presence** — facial expression and eye contact breakdown separate from vocal

---

## 9. MVP Scope

### In scope
- [ ] Auth / user accounts (Viewing profile as well)
- [ ] Mode selection from left sidebar on dashboard
- [ ] Session history persistence and displayed on dashboard
- [ ] Onboarding flow per mode (first time)
- [ ] Voice acting session: record + analyze + feedback
- [ ] Theatre session: record video + analyze + feedback
- [ ] Curated scenario library (3–5 per mode)
- [ ] Feedback screen with rubric + growth areas

### Explicitly out of scope (v2+)
- Singing / musical theatre analysis
- Freeform session builder / custom rubrics
- Persona selection
- Scene partner / reactive presence analysis
- Free upload without context
- Progress tracking over time
- Agentic AI integration
- Cloudflare/S3 for storage

---

## 10. Technical Component Map (Tentative)
> Don't over-spec here — just enough to validate feasibility before you pick the stack

Backend: Python + FastAPI
Auth + Persistence: Supabase
Frontend: React + Typescript

### Voice Acting pipeline
- Transcription → [Whisper]
- Prosody analysis (pitch, pace, breath) → [librosa]
- Filler word detection → transcript post-processing
- LLM feedback generation → Undecided

### Theatre pipeline
- Audio → same as voice acting pipeline
- Facial landmarks + gaze → MediaPipe
- Pose / gesture → MediaPipe
- LLM feedback synthesis → (Undecided) with multimodal input or serialized landmark data

---

## 11. Success Criteria
> How do you know MVP is done?

- [ ] A user can complete a full voice acting session end-to-end and receive feedback across all 7 dimensions (if all dimensions are applicable to the specific scenario)
- [ ] A user can complete a full theatre session end-to-end and receive feedback across all 5 in-scope dimensions (again if all 5 are applicable to the specific scenario)
- [ ] Feedback is anchored to specific moments — not generic
- [ ] Onboarding data visibly changes the feedback framing (e.g. commercial vs. audiobook feedback reads differently)

---

## Deferred Decisions
> Things you haven't decided yet that will affect implementation — don't let these block you but track them

- Hosting / deployment
- LLM provider (Claude vs. GPT-4)
- Whether MediaPipe runs client-side or server-side