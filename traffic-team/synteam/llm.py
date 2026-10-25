"""Общий вызов Claude для всех агентов: мозг из brain/ + роль агента + структурированный ответ."""
from functools import lru_cache
from typing import Optional, Type, TypeVar

import anthropic
from pydantic import BaseModel

from . import config

T = TypeVar("T", bound=BaseModel)

WEB_SEARCH = {"type": "web_search_20260209", "name": "web_search", "max_uses": 8}


@lru_cache(maxsize=1)
def client() -> anthropic.Anthropic:
    return anthropic.Anthropic()


@lru_cache(maxsize=1)
def brain() -> str:
    parts = []
    for path in sorted(config.BRAIN_DIR.glob("*.md")):
        parts.append(f"<file name=\"{path.name}\">\n{path.read_text(encoding='utf-8').strip()}\n</file>")
    return "\n\n".join(parts)


def run(role: str, task: str, output: Type[T], *, effort: str = "medium",
        web: bool = False, max_tokens: int = 32000) -> T:
    """Один шаг агента. Мозг кэшируется (стабильный префикс), роль и задача идут после него."""
    system = [
        {
            "type": "text",
            "text": "Ты часть ИИ-команды по трафику Syneps AI. Ниже база знаний команды.\n\n" + brain(),
            "cache_control": {"type": "ephemeral"},
        },
        {"type": "text", "text": role},
    ]
    messages = [{"role": "user", "content": task}]
    kwargs = dict(
        model=config.MODEL,
        max_tokens=max_tokens,
        system=system,
        thinking={"type": "adaptive"},
        output_config={"effort": effort},
        output_format=output,
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
    )
    if web:
        kwargs["tools"] = [WEB_SEARCH]

    # Веб-поиск может приостановить ход (pause_turn): продолжаем тот же диалог.
    for _ in range(5):
        with client().beta.messages.stream(messages=messages, **kwargs) as stream:
            response = stream.get_final_message()
        if response.stop_reason == "pause_turn":
            messages = messages + [{"role": "assistant", "content": response.content}]
            continue
        break

    if response.stop_reason == "refusal":
        raise RuntimeError(f"Модель отказалась выполнять задачу: {response.stop_details}")
    if response.stop_reason == "max_tokens":
        raise RuntimeError("Ответ обрезан по max_tokens: уменьши задачу или подними лимит")
    parsed: Optional[T] = response.parsed_output
    if parsed is None:
        raise RuntimeError("Модель не вернула структурированный ответ")
    return parsed
