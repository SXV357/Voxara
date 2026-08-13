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
