"""Publisher и сбор метрик. Threads через официальный API; остальные каналы пока через Metricool/Postiz."""
import time
from datetime import date, datetime, timedelta

from . import config, db
from .integrations.threads import ThreadsAccount


def compose(item: dict) -> str:
    text = item["body"].strip()
    if item.get("cta") and item["cta"] not in text:
        text = f"{text}\n\n{item['cta']}"
    return text


def publish_due() -> list[dict]:
    """Публикует одобренный контент Threads, у которого наступило время (или время не задано)."""
    due = db.query("""SELECT * FROM content_items
                      WHERE channel='threads' AND status='approved'
                        AND (scheduled_at IS NULL OR scheduled_at <= NOW())
                      ORDER BY scheduled_at NULLS FIRST, id LIMIT 10""")
    results = []
    for item in due:
        try:
            post = ThreadsAccount(item["account"]).publish(compose(item))
            db.update("content_items", item["id"], {
                "status": "published", "published_at": datetime.now(), "external_id": post["id"],
                "permalink": post["permalink"], "error": None})
            results.append({"id": item["id"], "ok": True, "permalink": post["permalink"]})
        except Exception as e:  # ошибку видно в дашборде, очередь не останавливается
            db.update("content_items", item["id"], {"status": "failed", "error": str(e)[:1000]})
            results.append({"id": item["id"], "ok": False, "error": str(e)})
    return results


def sync_threads_metrics() -> int:
    """Метрики по постам за 14 дней + дневные метрики аккаунтов в channel_daily."""
    items = db.query("""SELECT id, account, external_id FROM content_items
                        WHERE channel='threads' AND status='published' AND external_id IS NOT NULL
                          AND published_at >= NOW() - INTERVAL '14 days'""")
    for item in items:
        m = ThreadsAccount(item["account"]).post_insights(item["external_id"])
        db.insert("content_metrics", {
            "content_id": item["id"], "views": m.get("views", 0), "likes": m.get("likes", 0),
            "replies": m.get("replies", 0), "reposts": m.get("reposts", 0) + m.get("quotes", 0),
            "shares": m.get("shares", 0)})
    yesterday = date.today() - timedelta(days=1)
    since = int(time.mktime(yesterday.timetuple()))
    for name in config.THREADS_ACCOUNTS:
        m = ThreadsAccount(name).account_insights(since, since + 86400)
        upsert_daily(yesterday, "threads", name, followers=m.get("followers_count", 0),
                     views=m.get("views", 0),
                     engagement=m.get("likes", 0) + m.get("replies", 0) + m.get("reposts", 0) + m.get("quotes", 0))
    return len(items)


def import_metricool(path: str) -> int:
    """Загружает дневную выгрузку Metricool (columns + rows, как в data/*.json) в channel_daily."""
    import json
    data = json.load(open(path, encoding="utf-8"))
    cols = data["columns"]
    n = 0
    for raw in data["rows"]:
        r = dict(zip(cols, raw))
        num = lambda k: int(float(r.get(k) or 0))
        day = datetime.strptime(r["date"], "%Y%m%d").date()
        upsert_daily(day, data["channel"], data["account"], followers=num("followers"),
                     views=num("views") or num("reels_views"), reach=num("reach"),
                     engagement=num("interactions"))
        n += 1
    return n


def upsert_daily(day, channel: str, account: str, **metrics) -> None:
    cols = ["date", "channel", "account", *metrics]
    vals = [day, channel, account, *metrics.values()]
    updates = ",".join(f"{k}=EXCLUDED.{k}" for k in metrics)
    db.query(f"""INSERT INTO channel_daily ({','.join(cols)}) VALUES ({','.join(['%s'] * len(cols))})
                 ON CONFLICT (date, channel, account) DO UPDATE SET {updates}""", vals)
