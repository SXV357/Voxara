from pydantic import BaseModel


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


class FeedbackDimension(BaseModel):
    dimension: str
    score: int  # 1-5
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
