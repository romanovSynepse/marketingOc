"""Уведомления Нику в Telegram: план дня, черновики на апрув, итоги публикаций."""
import requests

from .. import config


def notify(text: str) -> bool:
    if not (config.TELEGRAM_BOT_TOKEN and config.TELEGRAM_CHAT_ID):
        return False
    for chunk in [text[i:i + 4000] for i in range(0, len(text), 4000)]:
        requests.post(
            f"https://api.telegram.org/bot{config.TELEGRAM_BOT_TOKEN}/sendMessage",
            json={"chat_id": config.TELEGRAM_CHAT_ID, "text": chunk, "disable_web_page_preview": True},
            timeout=30,
        )
    return True
