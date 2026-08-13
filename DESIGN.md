---
name: Voxara
description: A coaching platform for voice acting and theatre performance — feedback that feels like a real coach, not an algorithm.
colors:
  studio-crimson: "oklch(0.50 0.170 27)"
  coaching-amber: "oklch(0.68 0.140 72)"
  canvas: "oklch(0.980 0.008 72)"
  studio-surface: "oklch(0.945 0.016 72)"
  studio-warm: "oklch(0.900 0.028 72)"
  ink: "oklch(0.15 0.025 27)"
  muted: "oklch(0.50 0.018 27)"
  input-border: "oklch(0.85 0.010 27)"
typography:
  display:
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.2
  headline:
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  title:
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.4
  body:
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
rounded:
  button: "6px"
  card: "8px"
  input: "6px"
  pip: "4px"
spacing:
  "4": "4px"
  "8": "8px"
  "12": "12px"
  "16": "16px"
  "20": "20px"
  "24": "24px"
  "32": "32px"
  "48": "48px"
  "64": "64px"
components:
  button-primary:
    backgroundColor: "{colors.studio-crimson}"
    textColor: "#ffffff"
    rounded: "{rounded.button}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "oklch(0.40 0.170 27)"
    textColor: "#ffffff"
    rounded: "{rounded.button}"
    padding: "10px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "10px 20px"
  button-ghost-hover:
    backgroundColor: "{colors.studio-warm}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "10px 20px"
  button-disabled:
    backgroundColor: "{colors.studio-surface}"
    textColor: "{colors.muted}"
    rounded: "{rounded.button}"
    padding: "10px 20px"
  card:
    backgroundColor: "{colors.studio-surface}"
    rounded: "{rounded.card}"
    padding: "16px"
  card-interactive:
    backgroundColor: "{colors.studio-surface}"
    rounded: "{rounded.card}"
    padding: "20px"
  card-interactive-hover:
    backgroundColor: "{colors.studio-warm}"
    rounded: "{rounded.card}"
    padding: "20px"
  input-default:
    backgroundColor: "{colors.studio-surface}"
    rounded: "{rounded.input}"
    padding: "10px 12px"
  input-error:
    backgroundColor: "{colors.studio-surface}"
    rounded: "{rounded.input}"
    padding: "10px 12px"
---

# Design System: Voxara

## 1. Overview

**Creative North Star: "The Studio Anteroom"**

The room before the recording booth. Warm, quiet, prepared — the kind of space that puts you at ease before the work begins. Voxara's interface occupies the same register: it creates the conditions for a real coaching experience and makes you *want* to be here. When a student sees their feedback, the UI should feel like someone who genuinely cares sat down with them, pointed at specific moments, and said exactly what to try next.

Color is restrained and purposeful. Warmth comes from the amber that runs through the surfaces — not from decoration, but from the material quality of the space itself. A deep warm crimson anchors the identity on primary actions. The surface is a warm near-white that has genuine presence without weight. Every screen has one job; none of them feel like work.

References that capture the right register: **Notion** (information presented with genuine typographic care), **Pitch** (focused creative-professional product, generous spacing, nothing decorative), **Are.na** (calm, open, non-institutional — a thoughtful space that validates serious creative work). All three feel like spaces, not tools.

**Key Characteristics:**
- Warm without being cozy: inviting, not casual
- Craft-focused: the UI signals that what you're doing here is serious and worth your time
- Light and open: no visual weight that competes with the work
- Coaching-toned: the vocabulary of the UI matches the vocabulary of a supportive coach
- Restrained motion that communicates state, not decoration

## 2. Colors: The Studio Palette

Warmth-forward, light-surfaced strategy. Amber runs through the surfaces and creates the studio atmosphere. Crimson does the identity work on primary actions. Nothing gets dark — the light is always on in this room.

### Primary
- **Studio Crimson** (`oklch(0.50 0.170 27)` — deep warm red): Used exclusively on primary CTA buttons, active nav indicators, and recording state (the "live" moment). White text on all filled applications. Its rarity is the point — it signals the most important action on any given screen. Not used decoratively.

### Secondary
- **Coaching Amber** (`oklch(0.68 0.140 72)` — warm amber/ochre): Dimension badges, score pips, growth area markers, card hover tints, and active section backgrounds. Carries structural warmth through the UI — not just a badge color. Distinct from the primary in both hue (72° vs 27°) and lightness. Never used for primary actions.

### Neutral
- **Canvas** (`oklch(0.980 0.008 72)` — barely warm near-white): Page background. A very subtle amber tilt — enough to read as a warm space rather than a clinical white. Not cream, not paper. The warmth registers without looking tinted.
- **Studio Surface** (`oklch(0.945 0.016 72)` — warm light stone): Cards, panels, sidebar background, session cards. More present than a near-white — this surface has genuine character. Tonal separation from Canvas creates layers without shadows.
- **Studio Warm** (`oklch(0.900 0.028 72)` — warm amber-gray mid-tone): Hover states on interactive cards and sidebar items, active backgrounds, section warmth moments. Bridges surface and accent. This is the color that signals "this area is alive" without reaching for crimson. Background-only — never used for text or borders.
- **Ink** (`oklch(0.15 0.025 27)` — very dark, slightly warm near-black): All body text. Target ≥16:1 contrast vs Canvas.
- **Muted** (`oklch(0.50 0.018 27)` — medium-dark warm gray): Secondary text, labels, placeholder text, timestamps, metadata. Target ≥4.5:1 contrast vs Canvas. Never lighter than this value; legibility over elegance.

### Named Rules
**The Scarcity Rule.** Studio Crimson appears on ≤15% of any given screen. It marks the single most important interactive moment — the recording button, the primary CTA, the active sidebar item. When everything is red, nothing is. Reserve it, and it earns its weight.

**The Warmth Rule.** Structural warmth comes from Coaching Amber and Studio Warm, not from the surface tint alone. When a card or nav item is hovered or active, it should warm — not just darken or shadow. Warmth is the primary interactivity signal; shadow is secondary.

**The Light-Is-The-Default Rule.** Surfaces stay light. The warmth is in the character of the light, not in reducing it. Dark surfaces belong to a different product.

**The No Blue-Purple Rule.** No blue, indigo, or purple in the palette. These are the generic tech defaults and contradict the creative-professional character Voxara is building. If a need arises (semantic error state, info callout), use the amber accent or a warm mid-gray variant — not blue.

## 3. Typography

**UI Font:** Plus Jakarta Sans (with fallback: system-ui, -apple-system, sans-serif)

**Character:** A humanist geometric sans with warmth in the letterforms — slightly open apertures, friendly but not playful, excellent legibility at small sizes. One family carries headings, body, labels, and data. No display/body pairing; this is a product surface where consistency earns trust.

### Hierarchy

- **Display** (600 weight, 1.75rem/28px, line-height 1.2): Page titles and session headings (`h1`). Used once per screen, never in repeating components. `text-wrap: balance`.
- **Headline** (600 weight, 1.25rem/20px, line-height 1.3): Card headings, section headings within feedback view, scenario titles.
- **Title** (500 weight, 1rem/16px, line-height 1.4): Sidebar nav labels, form section headings, rubric dimension names.
- **Body** (400 weight, 0.875rem/14px, line-height 1.6): All prose — feedback summary, scenario context, growth area descriptions. Max line length 65–72ch on any readable surface.
- **Label** (500 weight, 0.75rem/12px, line-height 1.4, `letter-spacing: 0.01em`): Badges, timestamps, dimension score labels, metadata, form labels. Never uppercase-tracked eyebrows.

### Named Rules
**The Single Family Rule.** Plus Jakarta Sans only. No display font pairings, no serif headings "for character." Brand character comes from the crimson and the quality of information hierarchy — not from typographic mixing.

**The No Eyebrow Rule.** Small all-caps tracked labels (`VOICE ACTING`, `FEEDBACK`, `SETTINGS`) above every section heading are prohibited. They read as AI scaffold. Section names live in the heading hierarchy itself, or are simply absent when context is established by navigation.

## 4. Elevation

Flat-by-default. Depth expressed through tonal layering (Canvas → Studio Surface → Studio Warm) rather than shadows. Interactive card hover: background shifts to Studio Warm. Shadow is secondary to the warmth signal.

### Shadow Vocabulary
- **Float** (`0 2px 8px oklch(0.15 0.025 27 / 0.08)`): Applied on hover to clickable session history cards alongside Studio Warm background shift. Confirms interactivity without visual noise. Not used at rest.
- **Lift** (`0 4px 16px oklch(0.15 0.025 27 / 0.12)`): Reserved for dropdown menus, command palette, and any overlaid panel. Never applied to static content.

### Named Rules
**The Flat-By-Default Rule.** Elements are flat at rest. Shadow appears only as a response to state (hover on interactive cards) or structural float (dropdowns, overlays). Do not use shadows to add "depth" to static cards or sections.

**The Warmth-Before-Shadow Rule.** When signaling interactivity on hover, shift background to Studio Warm first. Add Float shadow if additional depth is needed. Warmth is the primary signal; shadow is the secondary.

## 5. Components

*Seed mode: no implemented components yet. Canonical primitives described per design direction. Revise to match real tokens once code exists.*

### Buttons
- **Shape:** Gently rounded (6px radius)
- **Primary:** Studio Crimson fill (`oklch(0.50 0.170 27)`), white text, 500 weight, 14px. Padding 10px 20px. The only use of crimson as a fill.
- **Hover:** Crimson darkened ~10% lightness; `transition: background 150ms ease-out`. No transform or scale.
- **Focus visible:** 2px crimson outline, 2px offset. Never hidden.
- **Ghost / Secondary:** No fill, Ink-colored text, 1px Studio Surface border. Hover: Studio Surface background.
- **Disabled:** Muted text, Studio Surface background, no cursor pointer. No crimson on disabled states.

### Cards
- **Corner Style:** Gently rounded (8px radius)
- **Background:** Studio Surface at rest. Studio Warm on hover for interactive session cards.
- **Shadow:** None at rest. Float shadow added on hover alongside Studio Warm background shift.
- **Border:** None. Tonal separation from Canvas background creates the boundary.
- **Internal Padding:** 16px standard; 20px for feedback dimension cards.

### Inputs / Fields
- **Style:** 1px border in `oklch(0.85 0.010 27)` (warm light gray), Studio Surface background, 6px radius.
- **Focus:** Border shifts to Ink (`oklch(0.15 0.025 27)`), `transition: border-color 150ms ease-out`. No glow or halo.
- **Error:** Border shifts to Studio Crimson. Error text in a warm-shifted red below the field.
- **Disabled:** Muted border, Muted text, no cursor.

### Navigation (Sidebar)
- **Background:** Studio Surface
- **Default items:** Title weight, Ink text, transparent background.
- **Hover:** Studio Warm background. No left-border accent.
- **Active:** Studio Crimson left indicator (3px), Ink text at 600 weight, Studio Warm background.
- **Disabled (Theatre tab):** Muted text, `cursor: not-allowed`, opacity 50%. No crimson.

### Feedback Dimension Score (Signature Component)
The visual that matters most in this product. Horizontal row of five small rectangles (5×20px, 4px radius, 4px gap), filled to the score value in Studio Crimson. Unfilled pips in Studio Surface with a 1px warm-light-gray border. Score label in Muted text. Dimension name in Title weight. This pattern should be consistent across every feedback view — no alternative score visualizations.

### Recording State Indicator
Idle: a 10px circle in Muted, no animation. When `MediaRecorder` is active, the circle fills Studio Crimson and pulses at 1s intervals (`opacity: 1 → 0.4 → 1`, `ease-in-out`). This is the baseline continuous animation in the product; all other motion is a response to user interaction.

**Named exception — Waveform Carousel.** The one deliberate second continuous animation, scoped tightly: while `MediaRecorder` is actively recording (not idle, not paused, not stopped), a horizontal strip of amplitude bars driven by a live Web Audio `AnalyserNode` scrolls continuously next to the dot, confirming to the performer that the mic is actually capturing sound. It freezes the instant recording is paused and disappears when stopped or idle. This exists only on the recording screen and only during the active-recording state — it does not generalize to "waveforms are now a motif"; don't reach for it elsewhere. Respects `prefers-reduced-motion` (falls back to static "Capturing audio…" text).

## 6. Do's and Don'ts

### Do:
- **Do** use Studio Crimson only on primary interactive moments: the record button, primary CTA, active nav indicator. Its scarcity is what makes it mean something.
- **Do** use Studio Warm as the primary hover/active signal on cards and sidebar items. Warmth communicates interactivity before any other visual change.
- **Do** let Coaching Amber carry structural warmth beyond badges — hover tints, active section backgrounds, score pips. It is the warmth of the room, not just a data color.
- **Do** present feedback in a clear visual hierarchy: summary → dimension scores → strengths → growth areas. Users need to parse this quickly; don't bury the key findings.
- **Do** use tonal layering (Canvas → Studio Surface → Studio Warm) to define layers and states rather than shadows. Flat-by-default.
- **Do** give every interactive component its full state vocabulary: default, hover, focus, active, disabled. Half-states are not shipping.
- **Do** keep body text at Ink (`oklch(0.15 0.025 27)`) on Canvas backgrounds. Muted text is for secondary information only.
- **Do** cap body prose at 65–72ch. Feedback text especially — these are the words a user is reading carefully.
- **Do** write UI copy in the coaching register: direct, specific, encouraging. Labels and messages should sound like a supportive coach, not a software system.
- **Do** keep transitions at 150–250ms with `ease-out` curves. The UI is in service of a task; don't make users wait for choreography.

### Don't:
- **Don't** use pure white (`oklch(1.000 0.000 0)`) for Canvas. The warmth of the space requires the amber tilt — even barely perceptible, it registers.
- **Don't** use Studio Warm for text or borders. It is a background-only color; its role is to warm surfaces, not create contrast.
- **Don't** use enterprise SaaS patterns: dashboard hero metrics, feature grid sections, navy-and-blue palettes, impersonal corporate tone. This product is for performing artists, not office workers.
- **Don't** use gamification UI (streaks, XP bars, confetti, progress-based reward animation). Voxara is serious skill development; trivializing it undermines trust.
- **Don't** use a dark/gothic aesthetic. The brief explicitly excludes it.
- **Don't** use blue or purple anywhere in the palette. These are the generic tech defaults and contradict the creative identity.
- **Don't** use gradient text (`background-clip: text`). Single solid color only.
- **Don't** use side-stripe borders (`border-left` > 1px as a colored accent). Rewrite with background tints or no border.
- **Don't** write vague feedback UI copy. Every piece of text in the feedback screen should be specific: names a moment, quotes a phrase, gives a timestamp. Generic ("good energy") is a design failure here, not just a content failure.
- **Don't** use motion for decoration. Continuous animation is reserved for the recording pulse and its scoped Waveform Carousel exception (see Recording State Indicator) — nothing else runs continuously. Everything else is a response to user interaction.
- **Don't** build modal-first flows. Onboarding, profile editing, scenario context: inline or separate screens. Modals as a first answer are a design shortcut, not a UX decision.
