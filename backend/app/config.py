
from pydantic_settings import BaseSettings

class Setting(BaseSettings):
    DATABASE_NAME:str
    MONGODB_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_SERVER: str
    MAIL_PORT: int
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""

    # Supabase Storage — when unset, uploads fall back to local disk
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_BUCKET: str = "uploads"

    # Extra browser origins allowed to call the API, comma-separated.
    # Not needed when the frontend is served by this same app.
    CORS_ORIGINS: str = ""

    # Directory holding the built frontend (frontend/dist copied here).
    # When it does not exist, the API runs on its own and Vite serves the UI.
    STATIC_DIR: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"
settings = Setting()
#these are the variables for the 2FA
