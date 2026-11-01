"""CLI команды по трафику:  python -m synteam <команда> --help"""
import argparse
import csv
import json
import time
from datetime import datetime

from . import publisher
from .agents import analyst, outreach, rewrite, scout, strategist, writer
from .integrations import telegram


def _print(obj):
    print(json.dumps(obj, ensure_ascii=False, indent=2, default=str))


def cmd_plan(a):
    day = strategist.plan(a.note)
    text = strategist.render(day)
    print(text)
    if a.telegram:
        telegram.notify(text)


def cmd_scout(a):
    _print(scout.scan(a.topic, open(a.file, encoding="utf-8").read() if a.file else "", a.lang).model_dump())


def cmd_write(a):
    rows = writer.write(a.channel, a.count, a.brief, a.lang, a.account)
    _print([{k: r[k] for k in ("id", "channel", "hook", "utm_url")} for r in rows])


def cmd_rewrite(a):
    original = open(a.file, encoding="utf-8").read() if a.file else a.text
    rows = writer.rewrite(original, a.channels.split(","), a.variants, a.lang, a.account, a.url)
    _print([{k: r[k] for k in ("id", "channel", "hook")} for r in rows])


def cmd_publish(a):
    _print(publisher.publish_due())


def cmd_sync(a):
    print(f"Обновлено постов Threads: {publisher.sync_threads_metrics()}")


def cmd_report(a):
    r = analyst.report(a.days)
    _print(r.model_dump())
    if a.telegram:
        telegram.notify(f"📊 {r.headline}\n\nУзкое место: {r.bottleneck}\n\nНа неделю:\n- " + "\n- ".join(r.next_week))


def cmd_outreach(a):
    if a.send:
        print(f"Отправлено писем: {outreach.send_approved()}")
        return
    with open(a.csv, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            lead = outreach.draft(row["brand"], row.get("website", ""), row.get("notes", ""), a.lang)
            print(f"#{lead['id']} {lead['brand']}: fit {lead['fit_score']} | {lead['subject']}")


def cmd_rw(a):
    if a.action == "add":
        text = open(a.file, encoding="utf-8").read() if a.file else a.text
        src = rewrite.add_source(a.url, text, a.channels, a.lang)
        print(f"Источник #{src['id']} добавлен. Дальше: python -m synteam rw tick (или подождать автопилот)")
    elif a.action == "tick":
        for e in rewrite.tick():
            print(e)
            if a.telegram:
                telegram.notify(e)
    elif a.action == "analyze":
        _print(rewrite.analyze(a.id))
    elif a.action == "experiment":
        print(f"Эксперимент #{rewrite.start_experiment(a.id, a.variants)}")
    elif a.action == "evaluate":
        _print(rewrite.evaluate(a.id))
    elif a.action == "scale":
        print(f"Масштаб → эксперимент #{rewrite.scale(a.id, a.count)}")


def cmd_worker(a):
    """Простой планировщик без зависимостей: план утром, публикация каждые 15 минут, метрики ночью."""
    done = set()
    while True:
        now = datetime.now()
        key = now.strftime("%Y-%m-%d")
        try:
            if now.hour == a.plan_hour and ("plan", key) not in done:
                telegram.notify(strategist.render(strategist.plan()))
                done.add(("plan", key))
            if now.hour == 3 and ("sync", key) not in done:
                publisher.sync_threads_metrics()
                done.add(("sync", key))
            for event in rewrite.tick():
                telegram.notify(event)
            for r in publisher.publish_due():
                telegram.notify(f"✅ Threads #{r['id']}: {r.get('permalink')}" if r["ok"]
                                else f"⚠️ Threads #{r['id']}: {r['error']}")
        except Exception as e:
            telegram.notify(f"⚠️ worker: {e}")
            print(e)
        time.sleep(900)


def main():
    p = argparse.ArgumentParser(prog="synteam", description="ИИ-команда по трафику Syneps")
    sub = p.add_subparsers(required=True)

    s = sub.add_parser("plan", help="Head of Traffic: план на день")
    s.add_argument("--note", default="")
    s.add_argument("--telegram", action="store_true")
    s.set_defaults(fn=cmd_plan)

    s = sub.add_parser("scout", help="Trend Radar: найти и разобрать виральные паттерны")
    s.add_argument("--topic", default="")
    s.add_argument("--file", help="файл с примерами (тексты, транскрипты, ссылки)")
    s.add_argument("--lang", default="RU")
    s.set_defaults(fn=cmd_scout)

    s = sub.add_parser("write", help="Writer: черновики в очередь на апрув")
    s.add_argument("--channel", default="threads")
    s.add_argument("--count", type=int, default=5)
    s.add_argument("--brief", default="")
    s.add_argument("--lang", default="RU")
    s.add_argument("--account", default="nickromanov")
    s.set_defaults(fn=cmd_write)

    s = sub.add_parser("rewrite", help="Rewriter: новые единицы по паттерну вирального оригинала")
    s.add_argument("--text", default="")
    s.add_argument("--file")
    s.add_argument("--url", default="", help="ссылка на оригинал (для истории)")
    s.add_argument("--channels", default="threads,instagram_reels")
    s.add_argument("--variants", type=int, default=3)
    s.add_argument("--lang", default="RU")
    s.add_argument("--account", default="nickromanov")
    s.set_defaults(fn=cmd_rewrite)

    s = sub.add_parser("rw", help="Rewrite Agent: оригинал → разбор → эксперимент хуков → победитель → масштаб")
    s.add_argument("action", choices=["add", "tick", "analyze", "experiment", "evaluate", "scale"])
    s.add_argument("--url", default="")
    s.add_argument("--text", default="")
    s.add_argument("--file")
    s.add_argument("--id", type=int, help="id источника (analyze, experiment) или эксперимента (evaluate, scale)")
    s.add_argument("--channels", default="threads,instagram_reels")
    s.add_argument("--variants", type=int, default=4)
    s.add_argument("--count", type=int, default=6)
    s.add_argument("--lang", default="RU")
    s.add_argument("--telegram", action="store_true")
    s.set_defaults(fn=cmd_rw)

    s = sub.add_parser("publish", help="Опубликовать одобренное в Threads")
    s.set_defaults(fn=cmd_publish)

    s = sub.add_parser("sync", help="Собрать метрики Threads")
    s.set_defaults(fn=cmd_sync)

    s = sub.add_parser("import-metricool", help="Загрузить выгрузку Metricool (JSON) в channel_daily")
    s.add_argument("path")
    s.set_defaults(fn=lambda a: print(f"Загружено дней: {publisher.import_metricool(a.path)}"))

    s = sub.add_parser("report", help="Analyst: отчёт за период")
    s.add_argument("--days", type=int, default=7)
    s.add_argument("--telegram", action="store_true")
    s.set_defaults(fn=cmd_report)

    s = sub.add_parser("outreach", help="Outreach: черновики писем брендам из CSV или отправка одобренных")
    s.add_argument("--csv", help="CSV с колонками brand,website,notes")
    s.add_argument("--lang", default="RU")
    s.add_argument("--send", action="store_true")
    s.set_defaults(fn=cmd_outreach)

    s = sub.add_parser("worker", help="Автопилот: план, публикация, метрики по расписанию")
    s.add_argument("--plan-hour", type=int, default=9)
    s.set_defaults(fn=cmd_worker)

    a = p.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
