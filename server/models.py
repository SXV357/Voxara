from pydantic import BaseModel, Field


class VoiceActingProfile(BaseModel):
    subtypes: list[str]
    experience_level: str
    goals: str


class ScenarioSummary(BaseModel):
    id: str
    title: str
    context: str
    dimensions: list[str]


class Scenario(ScenarioSummary):
    script: str


class TranscriptWord(BaseModel):
    word: str
    start: float
    end: float


class Transcript(BaseModel):
    text: str
    words: list[TranscriptWord]


class FeedbackDimension(BaseModel):
    dimension: str
    score: int = Field(ge=1, le=5)
    rationale: str


class GrowthArea(BaseModel):
    issue: str
    where: str
    suggestion: str


class Feedback(BaseModel):
    summary: str
    dimensions: list[FeedbackDimension]
    strengths: list[str]
    growth_areas: list[GrowthArea]
    pronunciation_notes: str | None = None


class SessionSummary(BaseModel):
    id: str
    scenario_title: str
    mode: str
    status: str
    created_at: str
    feedback_summary: str | None = None


class SessionDetail(BaseModel):
    id: str
    status: str
    mode: str
    scenario: ScenarioSummary
    transcript: Transcript | None = None
    feedback: Feedback | None = None
    error_message: str | None = None
    created_at: str
