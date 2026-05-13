import os
from dotenv import load_dotenv

# Load the real .env so generated tokens match the running backend's secret key
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

os.environ.setdefault("ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
os.environ.setdefault("MONGODB_URL", "mongodb://localhost:27017")
os.environ.setdefault("DATABASE_NAME", "khadamni_test")
os.environ.setdefault("MAIL_USERNAME", "test@test.com")
os.environ.setdefault("MAIL_PASSWORD", "test")
os.environ.setdefault("MAIL_FROM", "test@test.com")
os.environ.setdefault("MAIL_SERVER", "smtp.gmail.com")
os.environ.setdefault("MAIL_PORT", "587")
