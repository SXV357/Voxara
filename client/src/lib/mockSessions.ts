import type { Feedback, SessionDetail, SessionSummary, Transcript } from '@/types';

/**
 * Stands in for the not-yet-built /api/sessions/* backend so FeedbackPage and
 * DashboardPage can be built and reviewed against realistic data. The
 * "processing" fixture flips to "complete" a few seconds after first fetch,
 * so the polling transition itself is visible in the browser. Swap these
 * fetchers for real `fetch('/api/sessions/...')` calls once the backend
 * pipeline exists — the page components' logic does not need to change.
 */

const PROCESSING_DURATION_MS = 6000;
const FAKE_LATENCY_MS = 300;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildTranscript(text: string, wordsPerSecond: number): Transcript {
  const words = text.split(/\s+/);
  const wordDuration = 1 / wordsPerSecond;
  return {
    text,
    words: words.map((word, i) => ({
      word,
      start: Number((i * wordDuration).toFixed(2)),
      end: Number(((i + 1) * wordDuration).toFixed(2)),
    })),
  };
}

const COMPLETE_SCRIPT =
  "This weekend only! Our brand-new Triple Smoke Stack is back — three patties, double cheese, smothered in smoky BBQ sauce, stacked high and priced low. Grab one, grab two, just don't wait — because Sunday night, it's gone. Triple Smoke Stack. This weekend. Only here.";

const COMPLETE_TRANSCRIPT = buildTranscript(COMPLETE_SCRIPT, 2.5);

const COMPLETE_FEEDBACK: Feedback = {
  summary:
    "This was a strong, high-energy read — you kept the excitement up the whole way through and landed the final line with real punch. The pacing occasionally outran your enunciation in the middle stretch, but your pitch variance carried the commercial feel exactly where it needed to.",
  dimensions: [
    {
      dimension: 'pacing',
      score: 4,
      rationale:
        'You kept a fast, energetic clip throughout without ever feeling rushed, matching the "act now" tone the script calls for.',
    },
    {
      dimension: 'pitch_variance',
      score: 5,
      rationale:
        'Strong upward lift on "Grab one, grab two" and a confident landing on the final line — exactly the shape a commercial read wants.',
    },
    {
      dimension: 'enunciation',
      score: 3,
      rationale:
        '"Smothered in smoky BBQ sauce" blurred together at your fastest pace — the consonants need a touch more separation to stay crisp at speed.',
    },
    {
      dimension: 'filler_words',
      score: 5,
      rationale: 'Clean read with no filler words or false starts.',
    },
  ],
  strengths: [
    'Energy stayed consistently high from the opening line through the tag — nothing dipped.',
    'The final "Triple Smoke Stack. This weekend. Only here." landed with real confidence and punch.',
  ],
  growth_areas: [
    {
      issue: 'A few words blurred together at your fastest pace.',
      where: '"smothered in smoky BBQ sauce"',
      suggestion:
        'Slightly widen the gap between "smoky" and "BBQ" — you can keep the same speed and still let each word land clean.',
    },
  ],
  pronunciation_notes:
    '"BBQ" was read as one fast blend — spelling it out mentally as B-B-Q for a beat can help it stay crisp even at pace.',
};

interface MockSession extends SessionDetail {
  processingStartedAt: number;
}

const now = Date.now();

let mockSessions: MockSession[] = [
  {
    id: 'session-processing',
    status: 'processing',
    mode: 'voice_acting',
    scenario: {
      id: 'nature-documentary',
      title: 'Nature Documentary — The Chase',
      context:
        "You're narrating a wildlife scene: a herd grazing peacefully, suddenly interrupted by a predator's chase, then settling back into calm.",
      dimensions: ['breath_support', 'pacing', 'enunciation'],
    },
    transcript: null,
    feedback: null,
    error_message: null,
    created_at: new Date(now - 2 * 60 * 1000).toISOString(),
    processingStartedAt: now,
  },
  {
    id: 'session-complete',
    status: 'complete',
    mode: 'voice_acting',
    scenario: {
      id: 'fast-food-commercial',
      title: 'Commercial — Triple Smoke Stack',
      context:
        "You're a hyped ad voice pitching a limited-time burger deal — upbeat, fast, energetic.",
      dimensions: ['pacing', 'pitch_variance', 'enunciation', 'filler_words'],
    },
    transcript: COMPLETE_TRANSCRIPT,
    feedback: COMPLETE_FEEDBACK,
    error_message: null,
    created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    processingStartedAt: now - PROCESSING_DURATION_MS - 1000,
  },
  {
    id: 'session-failed',
    status: 'failed',
    mode: 'voice_acting',
    scenario: {
      id: 'audiobook-dialogue',
      title: 'Audiobook Dialogue — The Same Story, Twice',
      context:
        "You're voicing two characters in one take: a calm, measured detective, and a nervous suspect whose story keeps changing.",
      dimensions: ['character_differentiation', 'breath_support', 'pacing'],
    },
    transcript: null,
    feedback: null,
    error_message: 'OpenRouter request failed after 2 attempts: 503 Service Unavailable',
    created_at: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
    processingStartedAt: now - PROCESSING_DURATION_MS - 1000,
  },
];

function resolveStatus(session: MockSession): MockSession {
  if (session.status !== 'processing') return session;
  if (Date.now() - session.processingStartedAt < PROCESSING_DURATION_MS) return session;
  return {
    ...session,
    status: 'complete',
    transcript: COMPLETE_TRANSCRIPT,
    feedback: COMPLETE_FEEDBACK,
  };
}

function tick(): void {
  mockSessions = mockSessions.map(resolveStatus);
}

function toSummary(session: MockSession): SessionSummary {
  return {
    id: session.id,
    scenario_title: session.scenario.title,
    mode: session.mode,
    status: session.status,
    created_at: session.created_at,
    feedback_summary: session.status === 'complete' ? (session.feedback?.summary ?? null) : null,
  };
}

export async function fetchMockSessions(): Promise<SessionSummary[]> {
  tick();
  await delay(FAKE_LATENCY_MS);
  return [...mockSessions]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(toSummary);
}

export async function fetchMockSessionDetail(id: string): Promise<SessionDetail> {
  tick();
  await delay(FAKE_LATENCY_MS);
  const found = mockSessions.find((session) => session.id === id);
  if (!found) throw new Error(`Session ${id} not found`);
  const { processingStartedAt: _processingStartedAt, ...detail } = found;
  return detail;
}
