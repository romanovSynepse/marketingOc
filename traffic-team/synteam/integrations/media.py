"""Метаданные и транскрипт оригинала через yt-dlp (опенсорс). Только публичные данные.

YouTube Shorts и TikTok обычно отдаются без логина. Instagram часто требует вход: тогда агент
работает по тексту, который вставили руками.
"""
import re
import statistics

import requests

try:
    import yt_dlp
except ImportError:  # агент работает и без yt-dlp, просто по вставленному тексту
    yt_dlp = None

PLATFORMS = {
    "youtube.com": "youtube_shorts", "youtu.be": "youtube_shorts", "tiktok.com": "tiktok",
    "instagram.com": "instagram_reels", "threads.net": "threads", "threads.com": "threads",
    "t.me": "telegram", "x.com": "x", "twitter.com": "x", "linkedin.com": "linkedin",
}


def platform_of(url: str) -> str:
    for host, name in PLATFORMS.items():
        if host in url:
            return name
    return "web"


def fetch(url: str) -> dict:
    """Возвращает {platform, author, title, text, views, likes, comments, author_median_views}."""
    out = {"platform": platform_of(url), "author": None, "title": None, "text": "", "views": None,
           "likes": None, "comments": None, "author_median_views": None}
    if yt_dlp is None:
        return out
    opts = {"quiet": True, "skip_download": True, "noplaylist": True, "writeautomaticsub": False}
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)
    out.update(author=info.get("uploader") or info.get("channel"), title=info.get("title"),
               views=info.get("view_count"), likes=info.get("like_count"),
               comments=info.get("comment_count"))
    out["text"] = "\n".join(filter(None, [info.get("title"), info.get("description"), _transcript(info)]))
    out["author_median_views"] = _author_median(info)
    return out


def _transcript(info: dict) -> str:
    """Субтитры (ручные или автоматические) → чистый текст без таймкодов."""
    for key in ("subtitles", "automatic_captions"):
        tracks = info.get(key) or {}
        for lang in ("ru", "en", *tracks.keys()):
            for track in tracks.get(lang, []):
                if track.get("ext") == "vtt" and track.get("url"):
                    vtt = requests.get(track["url"], timeout=30).text
                    lines = [l for l in vtt.splitlines()
                             if l and "-->" not in l and not l.startswith(("WEBVTT", "Kind:", "Language:"))]
                    text = re.sub(r"<[^>]+>", "", " ".join(dict.fromkeys(lines)))
                    return text[:6000]
    return ""


def _author_median(info: dict) -> int | None:
    """Медиана просмотров последних ~30 роликов автора: база для оценки «x к медиане»."""
    channel = info.get("channel_url") or info.get("uploader_url")
    if not channel:
        return None
    if "youtube.com" in channel:
        channel = channel.rstrip("/") + "/shorts"
    try:
        with yt_dlp.YoutubeDL({"quiet": True, "extract_flat": True, "playlistend": 30}) as ydl:
            feed = ydl.extract_info(channel, download=False)
    except Exception:
        return None
    views = [e.get("view_count") for e in (feed.get("entries") or []) if e.get("view_count")]
    return int(statistics.median(views)) if len(views) >= 5 else None
