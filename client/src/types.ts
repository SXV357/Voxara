export interface VoiceActingProfile {
  subtypes: string[];
  experience_level: string;
  goals: string;
}

export interface ScenarioSummary {
  id: string;
  title: string;
  context: string;
  dimensions: string[];
}

export interface Scenario extends ScenarioSummary {
  script: string;
}

export interface FeedbackDimension {
  dimension: string;
  score: number;
  rationale: string;
}

export interface GrowthArea {
  issue: string;
  where: string;
  suggestion: string;
}

export interface Feedback {
  summary: string;
  dimensions: FeedbackDimension[];
  strengths: string[];
  growth_areas: GrowthArea[];
  pronunciation_notes: string | null;
}

export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
}

export interface Transcript {
  text: string;
  words: TranscriptWord[];
}

export type SessionStatus = 'processing' | 'complete' | 'failed';

export interface SessionSummary {
  id: string;
  scenario_title: string;
  mode: string;
  status: SessionStatus;
  created_at: string;
  feedback_summary: string | null;
}

export interface SessionDetail {
  id: string;
  status: SessionStatus;
  mode: string;
  scenario: ScenarioSummary;
  transcript: Transcript | null;
  feedback: Feedback | null;
  error_message: string | null;
  created_at: string;
}
