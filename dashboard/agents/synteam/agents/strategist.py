"""Head of Traffic: план на день по всем каналам на основе метрик и очереди контента."""
from pydantic import BaseModel

from .. import db, llm

ROLE = """Роль: Head of Traffic. Ник ведёт маркетинг в одиночку, ты его руководитель трафика.
Каждый день ты:
1) смотришь метрики последних 7 дней и очередь контента,
2) выбираешь фокус и гипотезу дня,
3) раскладываешь задачи по каналам с количеством (норма в channels.md) и исполнителем:
   агент (scout, writer, analyst, outreach) или Ник (съёмка, апрув, звонки),
4) если метрики падают, включаешь антикризисные меры: больше единиц в каналах-победителях,
   новые хуки, рерайт лучших паттернов, ответы на все комментарии, прогрев тёплой базы.
Ник должен тратить на маркетинг не больше 60–90 минут в день. Его время — на то, что не автоматизируется."""


class Task(BaseModel):
    channel: str
    what: str
    count: int
    owner: str
    minutes_for_nick: int


class DayPlan(BaseModel):
    focus: str
    hypothesis: str
    crisis_mode: bool
    tasks: list[Task]
    kpi_today: list[str]
    message_to_nick: str


def _context() -> str:
    channels = db.query("""
        SELECT channel, account, SUM(views) views, SUM(engagement) engagement,
               SUM(link_clicks) clicks, MAX(followers) followers
        FROM channel_daily WHERE date >= CURRENT_DATE - 7 GROUP BY channel, account""")
    activities = db.query("""
        SELECT channel, SUM(reach) reach, SUM(clicks) clicks, SUM(leads) leads,
               SUM(signups) signups, SUM(payments) payments
        FROM traffic_activities WHERE date >= CURRENT_DATE - 7 GROUP BY channel""")
    queue = db.query("SELECT channel, status, COUNT(*) n FROM content_items GROUP BY channel, status")
    return (f"Метрики каналов за 7 дней: {channels}\n"
            f"Оцифровка активностей за 7 дней: {activities}\n"
            f"Очередь контента: {queue}")


def plan(note: str = "") -> DayPlan:
    task = _context() + (f"\nКомментарий Ника: {note}" if note else "") + "\nСоставь план на сегодня."
    day = llm.run(ROLE, task, DayPlan, effort="high")
    db.log_run("strategist", task, day.model_dump_json())
    return day


def render(day: DayPlan) -> str:
    lines = [f"⚡ План на день{' · АНТИКРИЗИС' if day.crisis_mode else ''}",
             f"Фокус: {day.focus}", f"Гипотеза: {day.hypothesis}", ""]
    for t in day.tasks:
        lines.append(f"• [{t.channel}] {t.what} ×{t.count} → {t.owner}"
                     + (f" ({t.minutes_for_nick} мин Ника)" if t.minutes_for_nick else ""))
    lines += ["", "KPI: " + "; ".join(day.kpi_today), "", day.message_to_nick]
    return "\n".join(lines)
