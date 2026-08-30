from pydantic_settings import BaseSettings

# type validation built in at startup, defines fallback values
# if .env file doesn't do so and one typed object to import

class Settings(BaseSettings):
    supabase_url: str
    supabase_service_role_key: str
    openrouter_api_key: str
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_primary_model: str = "openai/gpt-oss-120b:free"
    openrouter_fallback_model: str = "google/gemma-4-31b-it:free"
    whisper_model: str = "base"

    model_config = {"env_file": ".env"}


settings = Settings()
