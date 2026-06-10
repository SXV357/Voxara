# PRD: Voxara - A unified platform to empower the next generation of voice actors/actresses and theatre performers
**Version:** 0.1 (Draft)

**Author:** Shreyas Viswanathan 

**Last Updated:** Jun 9, 2026 

**Status:** In Progress

---

## 1. Problem Statement

### Voice Acting
> Who is the user, what specific problem do they have, and why do existing tools fail them?

[Fill in — ground this in the gap you identified: Orai/Yoodli serve business communication, not performance contexts]

### Theatre
> Same structure — who, what problem, why existing tools miss it

[Fill in]

---

## 2. Target Users

### Voice Acting
- **Primary:** [e.g. aspiring voice actors, students, hobbyists]
- **Subtypes captured at onboarding:** Commercial, Audiobook, Character/Animation
- **Experience level:** [beginner / intermediate — scope this down]

### Theatre
- **Primary:** [e.g. student performers, community theatre, drama school students]
- **Experience level:** [fill in]

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

## 4. App Structure

### Entry & Navigation
- User logs in → Dashboard with two coaching cards: **Voice Acting** and **Theatre**
- First time selecting a mode → triggers onboarding flow for that mode
- Returning user → goes directly to session selection

### Onboarding Per Mode (first time only)
**Voice Acting onboarding captures:**
- Subtype: Commercial / Audiobook / Character & Animation
- Experience level
- Goals (e.g. reduce filler words, improve character differentiation, mic technique)

**Theatre onboarding captures:**
- Focus area: [fill in — dramatic, comedic, musical-adjacent?]
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
5. Feedback screen rendered

### Theatre Session
1. User selects a curated scenario
2. User reads scenario context + script/prompt
3. User records video (in-app) — webcam + mic
4. App processes recording (audio + facial)
5. Feedback screen rendered

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
| 1 | [e.g. 15-second cereal commercial] | Commercial | Pacing, Enunciation, Energy |
| 2 | [e.g. villain monologue excerpt] | Character | Tonal Differentiation, Expressiveness |
| 3 | [e.g. audiobook passage with 2 characters] | Audiobook | Breath Support, Character Differentiation |
| 4 | [fill in] | | |
| 5 | [fill in] | | |

### Theatre (pick 3–5)
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
- [ ] Auth / user accounts
- [ ] Dashboard with mode selection
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
- Progress tracking over time / session history dashboard
- Mobile app

---

## 10. Technical Component Map
> Don't over-spec here — just enough to validate feasibility before you pick the stack

### Voice Acting pipeline
- Audio capture → [library TBD]
- Transcription → [Whisper or API TBD]
- Prosody analysis (pitch, pace, breath) → [librosa or TBD]
- Filler word detection → transcript post-processing
- LLM feedback generation → Claude / GPT-4 with structured prompt

### Theatre pipeline
- Video capture → [TBD]
- Audio → same as voice acting pipeline
- Facial landmarks + gaze → MediaPipe
- Pose / gesture → MediaPipe
- LLM feedback synthesis → Claude / GPT-4 with multimodal input or serialized landmark data

---

## 11. Success Criteria
> How do you know MVP is done?

- [ ] A user can complete a full voice acting session end-to-end and receive feedback across all 7 dimensions
- [ ] A user can complete a full theatre session end-to-end and receive feedback across all 5 in-scope dimensions
- [ ] Feedback is anchored to specific moments — not generic
- [ ] Onboarding data visibly changes the feedback framing (e.g. commercial vs. audiobook feedback reads differently)
- [ ] [Add any others]

---

## Deferred Decisions
> Things you haven't decided yet that will affect implementation — don't let these block you but track them

- Frontend framework
- Backend language / framework
- Hosting / deployment
- LLM provider (Claude vs. GPT-4)
- Audio processing library
- Whether MediaPipe runs client-side or server-side
- Session storage / database