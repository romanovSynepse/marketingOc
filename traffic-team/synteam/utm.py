"""UTM-ссылки: каждая единица контента и активность получает свою метку для оцифровки воронки."""
from urllib.parse import urlencode, urlparse, urlunparse, parse_qsl

from . import config


def build(source: str, medium: str, campaign: str, content: str = "", url: str = "") -> str:
    base = urlparse(url or config.SITE_URL)
    params = dict(parse_qsl(base.query))
    params.update({"utm_source": source, "utm_medium": medium, "utm_campaign": campaign})
    if content:
        params["utm_content"] = content
    return urlunparse(base._replace(query=urlencode(params)))


def slug(text: str) -> str:
    keep = [c.lower() if c.isalnum() else "-" for c in text.strip()]
    return "-".join(filter(None, "".join(keep).split("-")))[:40] or "general"
