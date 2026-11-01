"""Analyst: что сработало, что нет, куда удваивать. Недельный отчёт."""
from pydantic import BaseModel

from .. import db, llm

ROLE = """Роль: Performance Analyst. Смотришь на цифры честно: корреляцию не выдаёшь за атрибуцию.
Ищешь победителей (паттерн, рубрика, хук, канал, время), проигравших и узкие места воронки
(охват → клики → DM → заявки на демо → регистрации → оплаты). Даёшь конкретные действия на следующую неделю."""


class Insight(BaseModel):
    finding: str
    evidence: str
    action: str


class Report(BaseModel):
    headline: str
    funnel: str
    winners: list[Insight]
    losers: list[Insight]
    bottleneck: str
    next_week: list[str]


def report(days: int = 7) -> Report:
    top = db.query("""
        SELECT c.id, c.channel, c.rubric, c.hook, c.pattern, m.views, m.likes, m.replies, m.reposts, m.shares,
               m.saves, m.clicks, m.dms
        FROM content_items c
        JOIN LATERAL (SELECT * FROM content_metrics WHERE content_id=c.id ORDER BY collected_at DESC LIMIT 1) m ON true
        WHERE c.published_at >= NOW() - %s * INTERVAL '1 day'
        ORDER BY m.views DESC NULLS LAST LIMIT 40""", (days,))
    funnel = db.query("""
        SELECT channel, SUM(reach) reach, SUM(clicks) clicks, SUM(leads) leads, SUM(signups) signups,
               SUM(payments) payments, SUM(revenue) revenue, SUM(cost) cost
        FROM traffic_activities WHERE date >= CURRENT_DATE - %s GROUP BY channel""", (days,))
    task = (f"Период: {days} дней.\nКонтент и метрики:\n{top}\n\nВоронка по каналам:\n{funnel}\n"
            "Если данных мало, так и скажи и предложи, что начать мерить.")
    result = llm.run(ROLE, task, Report, effort="high")
    db.log_run("analyst", task, result.model_dump_json())
    return result
