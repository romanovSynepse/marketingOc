"""Настройки команды. Всё берётся из окружения (.env рядом с README или переменные контейнера)."""
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BRAIN_DIR = ROOT / "brain"


def _load_dotenv():
    env = ROOT / ".env"
    if not env.exists():
        return
    for line in env.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_dotenv()

MODEL = os.environ.get("SYNTEAM_MODEL", "claude-opus-5-5")
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/marketingoc")
SITE_URL = os.environ.get("SYNTEAM_SITE_URL", "https://syneps.ai")

# Threads: один или несколько аккаунтов.
# THREADS_ACCOUNTS='{"nickromanov": {"user_id": "me", "token": "..."}, "syneps_en": {...}}'
THREADS_ACCOUNTS: dict = json.loads(os.environ.get("THREADS_ACCOUNTS", "{}") or "{}")

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")

SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
OUTREACH_FROM = os.environ.get("OUTREACH_FROM", SMTP_USER)
OUTREACH_FOOTER = os.environ.get(
    "OUTREACH_FOOTER",
    "Syneps AI · hello@syneps.ai\nНе хотите получать письма? Ответьте «stop», и я больше не напишу.",
)
OUTREACH_DAILY_CAP = int(os.environ.get("OUTREACH_DAILY_CAP", "30"))
