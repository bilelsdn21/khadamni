from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from app.config import settings

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
)

async def send_otp_email(email: str, otp_code: str):
    message = MessageSchema(
        subject="Your Khadamni verification code",
        recipients=[email],
        body=f"Your verification code is: {otp_code}\n\nThis code expires in 5 minutes.",
        subtype="plain"
    )
    fm = FastMail(conf)
    await fm.send_message(message)


async def send_suspension_email(email: str, reason: str, until=None):
    if until:
        until_str = until.strftime("%B %d, %Y at %H:%M UTC")
        duration_text = f"until {until_str}"
    else:
        duration_text = "permanently"

    body = (
        f"Your Khadamni account has been suspended {duration_text}.\n\n"
        f"Reason: {reason}\n\n"
        f"If you believe this is a mistake, please contact support."
    )
    message = MessageSchema(
        subject="Your Khadamni account has been suspended",
        recipients=[email],
        body=body,
        subtype="plain"
    )
    fm = FastMail(conf)
    await fm.send_message(message)
