#!/usr/bin/env python3
"""SynOC · сборщик рилсов: HikerAPI → Supabase (шаги 1–2 конвейера).

Каждый запуск добавляет новый замер просмотров/лайков/комментов по каждому ролику.
Из повторных замеров база считает «выше нормы», «скорость» и «накрутку»
(см. infra/supabase/001_schema.sql, вью reel_scores и outliers).

Только стандартная библиотека Python 3.9+, ставить ничего не нужно.

Переменные окружения (ключи — только в настройках окружения / GitHub Secrets, не в чат):
  HIKERAPI_KEY           ключ HikerAPI
  SUPABASE_URL           https://<проект>.supabase.co
  SUPABASE_SERVICE_KEY   service_role ключ проекта (Settings → API)

Команды:
  python3 synoc_collect.py add potapovfx --niche "рост через контент" --client syneps
  python3 synoc_collect.py collect                 # все активные аккаунты
  python3 synoc_collect.py collect --handle potapovfx --dry-run   # без записи в базу
  python3 synoc_collect.py top --limit 20          # кандидаты в отбор (> 3× нормы)
  python3 synoc_collect.py parse ответ.json        # проверить разбор ответа HikerAPI офлайн
"""
from __future__ import annotations

import argparse
import json
import os
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

HIKER_BASE = os.environ.get("HIKERAPI_BASE", "https://api.hikerapi.com")
# Эндпоинты вынесены в переменные: если HikerAPI поменяет пути, правим окружение, не код.
HIKER_USER_EP = os.environ.get("HIKERAPI_USER_EP", "/v1/user/by/username")
HIKER_CLIPS_EP = os.environ.get("HIKERAPI_CLIPS_EP", "/v2/user/clips")

FULL_SYNC_PAGES = 3   # первый сбор: ~30+ роликов, чтобы посчитать норму автора
ROUTINE_PAGES = 1     # повторные замеры: свежие ролики, где ещё растут цифры


# ── HTTP ─────────────────────────────────────────────────────────────────────

def _ssl_context() -> ssl.SSLContext:
    for path in (os.environ.get("SSL_CERT_FILE"), "/root/.ccr/ca-bundle.crt"):
        if path and os.path.exists(path):
            return ssl.create_default_context(cafile=path)
    return ssl.create_default_context()


_CTX = _ssl_context()


def http(method: str, url: str, headers: dict, body=None, retries: int = 3):
    data = json.dumps(body).encode() if body is not None else None
    for attempt in range(retries + 1):
        req = urllib.request.Request(url, data=data, method=method, headers=headers)
        try:
            with urllib.request.urlopen(req, context=_CTX, timeout=60) as resp:
                raw = resp.read()
                return json.loads(raw) if raw else None
        except urllib.error.HTTPError as e:
            text = e.read().decode(errors="replace")[:500]
            if e.code in (429, 500, 502, 503, 504) and attempt < retries:
                time.sleep(2 ** (attempt + 1))
                continue
            raise RuntimeError(f"{method} {url.split('?')[0]} → HTTP {e.code}: {text}") from None
        except urllib.error.URLError as e:
            if attempt < retries:
                time.sleep(2 ** (attempt + 1))
                continue
            raise RuntimeError(f"{method} {url.split('?')[0]} → сеть: {e.reason}") from None


def need(name: str) -> str:
    val = os.environ.get(name)
    if not val:
        sys.exit(f"Нет переменной окружения {name}. Добавь её в настройки окружения (не в чат).")
    return val


# ── HikerAPI ─────────────────────────────────────────────────────────────────

def hiker(path: str, **params):
    q = urllib.parse.urlencode({k: v for k, v in params.items() if v is not None})
    return http("GET", f"{HIKER_BASE}{path}?{q}",
                {"x-access-key": need("HIKERAPI_KEY"), "accept": "application/json"})


def _first(d: dict, *keys, default=None):
    for k in keys:
        v = d.get(k) if isinstance(d, dict) else None
        if v not in (None, ""):
            return v
    return default


def parse_user(raw: dict) -> dict:
    u = raw.get("user", raw) if isinstance(raw, dict) else {}
    return {
        "external_id": str(_first(u, "pk", "id", "pk_id", default="")) or None,
        "followers": _first(u, "follower_count", "followers_count"),
        "full_name": _first(u, "full_name"),
        "bio": _first(u, "biography", "bio"),
    }


def extract_items(raw) -> tuple[list, str | None]:
    """Список медиа и курсор следующей страницы из ответа любой из форм HikerAPI."""
    cursor = None
    if isinstance(raw, list):                          # v1 chunk: [items, cursor]
        if len(raw) == 2 and isinstance(raw[0], list):
            return raw[0], raw[1] or None
        return raw, None
    if isinstance(raw, dict):
        cursor = _first(raw, "next_page_id", "end_cursor", "next_max_id")
        body = raw.get("response", raw)
        items = _first(body, "items", "medias", "data", default=[])
        cursor = cursor or _first(body, "next_max_id", "next_page_id")
        if isinstance(body.get("paging_info"), dict):
            cursor = cursor or body["paging_info"].get("max_id")
        return items, cursor
    return [], None


def parse_media(item: dict) -> dict | None:
    m = item.get("media", item) if isinstance(item, dict) else None
    if not isinstance(m, dict):
        return None
    code = _first(m, "code", "shortcode")
    taken = _first(m, "taken_at", "taken_at_ts", "taken_at_timestamp")
    if not code or taken is None:
        return None
    if isinstance(taken, (int, float)):
        taken_iso = datetime.fromtimestamp(taken, tz=timezone.utc).isoformat()
    else:
        taken_iso = str(taken)
    cap = m.get("caption")
    caption = _first(m, "caption_text") or (cap.get("text") if isinstance(cap, dict) else cap)
    pinned = bool(_first(m, "clips_tab_pinned_user_ids", "timeline_pinned_user_ids", default=[])) \
        or bool(m.get("is_pinned"))
    return {
        "shortcode": code,
        "external_id": str(_first(m, "pk", "id", default="")) or None,
        "caption": caption,
        "duration_s": _first(m, "video_duration", "duration"),
        "taken_at": taken_iso,
        "is_pinned": pinned,
        "views": _first(m, "play_count", "ig_play_count", "view_count", "video_view_count"),
        "likes": _first(m, "like_count"),
        "comments": _first(m, "comment_count"),
        "shares": _first(m, "reshare_count", "share_count", "media_repost_count"),
    }


def fetch_account(handle: str, pages: int) -> tuple[dict, list[dict]]:
    user = parse_user(hiker(HIKER_USER_EP, username=handle))
    if not user["external_id"]:
        raise RuntimeError(f"@{handle}: HikerAPI не вернул id пользователя")
    reels, cursor = [], None
    for _ in range(pages):
        items, cursor = extract_items(hiker(HIKER_CLIPS_EP, user_id=user["external_id"], page_id=cursor))
        reels += [r for r in (parse_media(i) for i in items) if r]
        if not cursor:
            break
    unique = {r["shortcode"]: r for r in reels}   # один ролик дважды в пакете ломает upsert
    return user, list(unique.values())


# ── Supabase (PostgREST) ─────────────────────────────────────────────────────

def sb(method: str, table: str, params: dict | None = None, body=None, prefer: str | None = None):
    key = need("SUPABASE_SERVICE_KEY")
    headers = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    if prefer:
        headers["Prefer"] = prefer
    q = ("?" + urllib.parse.urlencode(params)) if params else ""
    return http(method, f"{need('SUPABASE_URL').rstrip('/')}/rest/v1/{table}{q}", headers, body)


def upsert(table: str, rows, on_conflict: str):
    return sb("POST", table, {"on_conflict": on_conflict}, rows,
              prefer="resolution=merge-duplicates,return=representation")


# ── Команды ──────────────────────────────────────────────────────────────────

def norm(handle: str) -> str:
    return handle.strip().lstrip("@").lower()


def cmd_add(a):
    rows = [{"handle": norm(h), "niche": a.niche, "client": a.client, "role": a.role} for h in a.handles]
    rows = [{k: v for k, v in r.items() if v is not None} for r in rows]
    res = upsert("accounts", rows, "platform,handle")
    print(f"Добавлено/обновлено аккаунтов: {len(res or [])}")


def cmd_collect(a):
    now = datetime.now(timezone.utc).isoformat()
    if a.handle:
        accounts = [{"id": None, "handle": norm(a.handle)}]
        if not a.dry_run:
            accounts = sb("GET", "accounts", {"handle": f"eq.{norm(a.handle)}", "select": "id,handle"}) or []
            if not accounts:
                sys.exit(f"@{norm(a.handle)} нет в базе. Сначала: add {norm(a.handle)}")
    else:
        accounts = sb("GET", "accounts", {"active": "eq.true", "select": "id,handle"}) or []

    ok, failed = 0, []
    for acc in accounts:
        handle = acc["handle"]
        try:
            pages = a.pages
            if pages is None:
                known = 0 if a.dry_run else len(sb("GET", "reels", {"account_id": f"eq.{acc['id']}", "select": "id"}) or [])
                pages = FULL_SYNC_PAGES if known < 30 else ROUTINE_PAGES
            user, reels = fetch_account(handle, pages)
            if a.dry_run:
                print(json.dumps({"handle": handle, **user, "bio": None, "reels": reels[:3], "n_reels": len(reels)},
                                 ensure_ascii=False, indent=2))
                ok += 1
                continue
            sb("PATCH", "accounts", {"id": f"eq.{acc['id']}"},
               {**{k: v for k, v in user.items() if v is not None}, "updated_at": now})
            if reels:
                meta = ("shortcode", "external_id", "caption", "duration_s", "taken_at", "is_pinned")
                saved = upsert("reels", [{"account_id": acc["id"], **{k: r[k] for k in meta}} for r in reels],
                               "platform,shortcode")
                ids = {s["shortcode"]: s["id"] for s in saved}
                sb("POST", "snapshots", body=[{
                    "reel_id": ids[r["shortcode"]], "captured_at": now, "views": r["views"],
                    "likes": r["likes"], "comments": r["comments"], "shares": r["shares"],
                    "followers": user["followers"], "source": "hikerapi"} for r in reels if r["shortcode"] in ids],
                   prefer="return=minimal")
            print(f"@{handle}: {len(reels)} роликов, замер записан")
            ok += 1
        except Exception as e:  # один сломанный аккаунт не должен ронять весь сбор
            failed.append(handle)
            print(f"@{handle}: ОШИБКА {e}", file=sys.stderr)
    print(f"Готово: {ok} ок, {len(failed)} с ошибкой {failed if failed else ''}")
    if failed and not ok:
        sys.exit(1)


def cmd_top(a):
    params = {"select": "handle,url,views,outlier_x,er_pct,views_per_h_now,age_h",
              "order": "outlier_x.desc", "limit": str(a.limit)}
    if a.client:
        params["client"] = f"eq.{a.client}"
    rows = sb("GET", "outliers", params) or []
    if not rows:
        print("Пока нет роликов выше 3× нормы (или мало замеров).")
    for r in rows:
        print(f"{r['outlier_x']:>6}×  {r['views']:>9}  ER {r['er_pct']}%  "
              f"{r['views_per_h_now'] or '-'}/ч  @{r['handle']}  {r['url']}")


def cmd_parse(a):
    raw = json.load(open(a.file, encoding="utf-8"))
    items, cursor = extract_items(raw)
    parsed = [parse_media(i) for i in items]
    print(json.dumps({"items": len(items), "parsed": sum(1 for p in parsed if p), "next": cursor,
                      "sample": [p for p in parsed if p][:2]}, ensure_ascii=False, indent=2))


def main():
    p = argparse.ArgumentParser(description="SynOC: HikerAPI → Supabase")
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("add", help="добавить аккаунты для слежения")
    s.add_argument("handles", nargs="+")
    s.add_argument("--niche"); s.add_argument("--client")
    s.add_argument("--role", choices=["niche", "competitor", "own"])
    s.set_defaults(fn=cmd_add)

    s = sub.add_parser("collect", help="снять замер по аккаунтам")
    s.add_argument("--handle"); s.add_argument("--pages", type=int)
    s.add_argument("--dry-run", action="store_true", help="только показать, в базу не писать")
    s.set_defaults(fn=cmd_collect)

    s = sub.add_parser("top", help="кандидаты в отбор")
    s.add_argument("--client"); s.add_argument("--limit", type=int, default=20)
    s.set_defaults(fn=cmd_top)

    s = sub.add_parser("parse", help="проверить разбор сохранённого ответа HikerAPI")
    s.add_argument("file")
    s.set_defaults(fn=cmd_parse)

    a = p.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
