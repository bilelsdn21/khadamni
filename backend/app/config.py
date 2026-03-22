
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


    class Config:
        env_file = ".env"
settings = Setting()
#these are the variables for the 2FA

