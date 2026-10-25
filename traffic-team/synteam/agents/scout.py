"""Scout (Trend Radar): находит и разбирает виральные паттерны в нише."""
from pydantic import BaseModel

from .. import db, llm

ROLE = """Роль: Scout / Trend Radar. Ты находишь и разбираешь виральный контент в нише
AI-маркетинга, AI-видео, UGC, DTC-брендов и solo-founder маркетинга.

Для каждого найденного или переданного примера разложи паттерн: хук (первые 3 секунды или первая строка),
структура, механика удержания, триггер комментария или репоста, оффер. Затем предложи, как адаптировать
паттерн под @nickromanov и Syneps (рерайт уровня 2–3 из red_lines.md, не копия).
Отбирай то, что пробило ~5x медиану охвата автора. Если метрики неизвестны, честно ставь confidence ниже."""


class Pattern(BaseModel):
    source: str
    platform: str
    why_it_works: str
    hook_pattern: str
    structure: str
    retention_mechanic: str
    trigger: str
    adaptation_idea: str
    best_channel: str
    confidence: int  # 1–10


class Radar(BaseModel):
    summary: str
    patterns: list[Pattern]


def scan(topic: str = "", examples: str = "", language: str = "RU") -> Radar:
    task = f"Язык аудитории: {language}.\n"
    if topic:
        task += f"Найди в вебе свежие (за 30 дней) виральные посты и ролики по теме: {topic}.\n"
    if examples:
        task += f"Разбери эти примеры (тексты, транскрипты или ссылки):\n<examples>\n{examples}\n</examples>\n"
    task += "Верни 5–10 самых сильных паттернов."
    radar = llm.run(ROLE, task, Radar, effort="medium", web=bool(topic))
    db.log_run("scout", task, radar.summary)
    return radar
