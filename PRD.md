# PRD: Voxara - A unified platform to empower the next generation of voice actors/actresses and theatre performers
**Version:** 0.1 (Draft)

**Author:** Shreyas Viswanathan 

**Last Updated:** Jun 22, 2026 

**Status:** Initial version completed

---

## 1. Problem Statement

There are several platforms that exist out there geared towards helping people work on their public speaking and pronunciation skills - some examples are Orai, Yoodli, ELSA Speak, and Speeko. 
- Orai is more geared towards professionals practicing presentations, pitches and speeches. It records ones audio and video and gives post-session feedback on pace, energy and facial expressions. The facial analysis component exists but underdeveloped.
- Yoodli is a much more sophisticated multimodal coaching platform covering verbal and visual elements of delivery. It's more enterprise focused than consumer, but is real-time capable and supports deep, structured feedback.
- ELSA Speak is more like Duolingo but for English pronunciation and has a lot of gamified components like conversation simulations with AI, tracking progress etc. 
- Speeko functions more as a course platform providing audio analysis.

While Yoodli for example allows one to choose from ready-made roleplays or even create roleplays, which would dictate how feedback is presented separate from how is it structured in general cases, the platform as a whole isn't designed for those in the fine arts space - more specifically theatre performers and voice artists.

When we talk about public speaking in general or communication in a workspace environment, there are a baseline set of things the above platforms optimize for in terms of how they provide feedback. Performance is alive and art is subjective. More so, he human embodied nature of this work means that this humanity needs to be supported and not replaced.

Those that are involved in this space currently don't have a means of effectively practicing between rehearsals. They may take acting or voice lessons with coaches for example, but there is still a need for them to work on their skills outside of that and more importantly be able to receive specific and actionable feedback. Voxara aims to fill in the gap in terms of supporting the humanity behind voice acting and theatre performances while helping people in these spaces develop their confidence.

## 2. Target Users

### Voice Acting
- **Primary:** Aspiring voice actors, students, hobbyists
- **Subtypes captured at onboarding:** Commercial, Audiobook, Character/Animation, Narration

### Theatre
- **Primary:** Student performers, community theatre, drama school students

**Experience Level**: This tool will be able to support those who are starting off and those who also have some experience. This will be factored into the onboarding flow which will be used for the personalization aspect.

**Additional Note**: To further scope it, the target users of this application will be high school through college students. It will not account for kids 13 and under, professionals or even adults. Community theatre is an avenue that's open to anyone regardless of age, but the fact still remains that the vast majority of artists are students.

---

## 3. Design Constraints
> Non-negotiables that scope the product and inform how system prompts are constructed.

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

> Onboarding data feeds directly into the LLM system prompt for all subsequent sessions.

---

## 5. Session Flow

### Voice Acting Session
1. User selects a curated scenario (see Section 7)
2. User is presented with the scenario context and script then records audio (in-app)
3. App processes recording
4. Feedback screen rendered potentially alongside the audio transcript with timestamps

### Theatre Session
1. User selects a curated scenario
2. User reads scenario context + script/prompt
3. User records video (in-app) — webcam + mic
4. App processes recording (audio + facial)
5. Feedback screen rendered potentially alongside the recorded video, including transcript with timestamps

---

## 6. Feedback Dimensions

> Note: The listed dimensions are the critical ones but since the user is forced to choose from pre-defined scenarios in the MVP of the application, the scenarios may not appropriately surface all of them. In other words, it may not be possible to present feedback regarding all these aspects as part of a recording.

### Voice Acting
| Dimension | Measurable? | Method |
|---|---|---|
| Clarity / Enunciation | Yes | Audio analysis |
| Pacing & Intentional Pausing | Yes | Audio analysis |
| Pitch Variance & Expressiveness | Yes | Audio analysis (prosody) |
| Breath Support & Consistency | Partially | Audio analysis (phrase-end drop-off) |
| Filler Words & Flow | Yes | Transcript |
| Character / Tonal Differentiation | No | LLM inference |
| ~~Subtlety & Mic Awareness~~ | ~~Out of scope - Non measurable~~ | - |

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
| 5 | TBD | | |

### Theatre (pick 3–5) - Deferred until the E2E pipeline for voice acting has been tested and works (still part of the MVP)
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

**Note**: As mentioned earlier, the platform must function as a coach and not a judge. The feedback provided should not be flattening performance into "right" vs "wrong" since art is subjective. Furthermore, feedback should be rooted in the performer's goals since that is the reason the onboarding flow exists to capture such details.

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
- [ ] Session history persistence and displayed on dashboard (User can click an item and are taken to the feedback screen along with either the recording transcript or video + audio transcript)
- [ ] Onboarding flow per mode (first time)
- [ ] Voice acting session: record + analyze + feedback
- [ ] Theatre session: record video/audio + analyze + feedback
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
- Cloudflare R2/AWS S3 down the line for audio/video storage considering they could get arbitrarily large and Supabase's free tier not being the best supporter
- Being able to support performers 13 and under (niche area because of COPPA)

---

## 10. Technical Component Map (Tentative)
Backend: Python + FastAPI

Auth + Persistence: Supabase

Frontend: React + Typescript

LLMs:
- OpenRouter (Main ones that will be used)
  - gpt-oss-120b free (primary)
  - Gemma 4 31B free (fallback)
- Ollama (Last fallback if rate limits too much)
  - Qwen3-Coder 30B

> Note regarding LLMs: The priority in terms of LLMs is not having to pay any money but also getting access to ones with decent context windows and good reasoning abilities. Gemma 4 is a fallback for gpt-oss but the Ollama one exists as a fallback in case rate limits get very strict or the openRouter models don't work. A lot of Ollama models have specific compute requirements and offer full privacy but down the line, these models may be swapped out since they're not intended for production.

### Voice Acting pipeline
- Transcription → [Whisper]
- Prosody analysis (pitch, pace, breath) → [librosa]
- Filler word detection → transcript post-processing

### Theatre pipeline
- Audio → same as voice acting pipeline
- Facial landmarks + gaze → MediaPipe
- Pose / gesture → MediaPipe

---

## 11. Success Criteria
> How do you know MVP is done?

- [ ] A user can complete a full voice acting session end-to-end and receive feedback across all 7 dimensions (if all dimensions are applicable to the specific scenario otherwise specific, non-judgemental and actionable feedback on the relevant dimensions)
- [ ] A user can complete a full theatre session end-to-end and receive feedback across all 5 in-scope dimensions (again if all 5 are applicable to the specific scenario)
- [ ] Feedback is anchored to specific moments — not generic (feedback should be reviewed against the definition of what feedback should look like from interviews conducted with a senior theatre director and a voice coach)
- [ ] Onboarding data visibly changes the feedback framing (e.g. commercial vs. audiobook feedback reads differently)

**Note**: The above captures the functionality angle which is what matters, but also everything else being in a working state like account creation, profile viewing/updates, onboarding flow, session history, persistence, etc.

---

## Deferred Decisions
> Things you haven't decided yet that will affect implementation — don't let these block you but track them

- Hosting / deployment: Not that critical to decide at the time
- Whether MediaPipe runs client-side or server-side - Undecided