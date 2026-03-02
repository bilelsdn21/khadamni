
from pydantic_settings import BaseSettings

class Setting(BaseSettings):
    DATABASE_NAME:str
    MONGODB_URL: str
    SECRET_KEY: str

    class Config:
        env_file = ".env"
settings = Setting()
