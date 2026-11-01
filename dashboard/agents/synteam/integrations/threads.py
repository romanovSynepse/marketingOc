"""Официальный Threads API (graph.threads.net). Бесплатно, без сторонних сервисов.

Токен: Meta for Developers → приложение с продуктом Threads API → long-lived token (60 дней,
продлевается через refresh_token()). Права: threads_basic, threads_content_publish,
threads_manage_insights, threads_read_replies, threads_manage_replies.
"""
import time

import requests

from .. import config

BASE = "https://graph.threads.net/v1.0"
MAX_LEN = 500


class ThreadsAccount:
    def __init__(self, name: str):
        if name not in config.THREADS_ACCOUNTS:
            raise KeyError(f"Аккаунт Threads «{name}» не настроен в THREADS_ACCOUNTS")
        acc = config.THREADS_ACCOUNTS[name]
        self.name = name
        self.user_id = acc.get("user_id", "me")
        self.token = acc["token"]

    def _call(self, method: str, path: str, **params) -> dict:
        params["access_token"] = self.token
        resp = requests.request(method, f"{BASE}/{path}", params=params, timeout=30)
        data = resp.json()
        if resp.status_code >= 400 or "error" in data:
            raise RuntimeError(f"Threads API {path}: {data.get('error', data)}")
        return data

    def publish(self, text: str, image_url: str = "", reply_to_id: str = "") -> dict:
        """Публикует пост (или ответ). Возвращает {"id", "permalink"}."""
        if len(text) > MAX_LEN:
            raise ValueError(f"Пост длиннее {MAX_LEN} символов ({len(text)})")
        params = {"media_type": "IMAGE" if image_url else "TEXT", "text": text}
        if image_url:
            params["image_url"] = image_url
        if reply_to_id:
            params["reply_to_id"] = reply_to_id
        container = self._call("POST", f"{self.user_id}/threads", **params)
        if image_url:
            time.sleep(30)  # Meta рекомендует дать контейнеру с медиа обработаться
        post = self._call("POST", f"{self.user_id}/threads_publish", creation_id=container["id"])
        info = self._call("GET", post["id"], fields="permalink")
        return {"id": post["id"], "permalink": info.get("permalink", "")}

    def post_insights(self, media_id: str) -> dict:
        data = self._call("GET", f"{media_id}/insights", metric="views,likes,replies,reposts,quotes,shares")
        return {m["name"]: _value(m) for m in data.get("data", [])}

    def account_insights(self, since: int, until: int) -> dict:
        data = self._call("GET", f"{self.user_id}/threads_insights",
                          metric="views,likes,replies,reposts,quotes,followers_count",
                          since=since, until=until)
        return {m["name"]: _value(m) for m in data.get("data", [])}

    def replies(self, media_id: str) -> list[dict]:
        data = self._call("GET", f"{media_id}/replies", fields="id,text,username,timestamp")
        return data.get("data", [])

    def refresh_token(self) -> str:
        data = requests.get(f"https://graph.threads.net/refresh_access_token",
                            params={"grant_type": "th_refresh_token", "access_token": self.token},
                            timeout=30).json()
        return data.get("access_token", "")


def _value(metric: dict) -> int:
    if "total_value" in metric:
        return int(metric["total_value"].get("value", 0))
    return int(sum(v.get("value", 0) for v in metric.get("values", [])))
