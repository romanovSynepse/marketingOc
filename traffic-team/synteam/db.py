"""Доступ к той же Postgres, что и дашборд (таблицы из V0004__traffic_team.sql)."""
from contextlib import contextmanager

import psycopg2
import psycopg2.extras

from . import config


@contextmanager
def cursor():
    conn = psycopg2.connect(config.DATABASE_URL)
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            yield cur
        conn.commit()
    finally:
        conn.close()


def insert(table: str, row: dict) -> dict:
    cols = list(row)
    sql = f"INSERT INTO {table} ({','.join(cols)}) VALUES ({','.join(['%s'] * len(cols))}) RETURNING *"
    with cursor() as cur:
        cur.execute(sql, [row[c] for c in cols])
        return cur.fetchone()


def update(table: str, row_id: int, fields: dict) -> None:
    sets = ",".join(f"{k}=%s" for k in fields)
    with cursor() as cur:
        cur.execute(f"UPDATE {table} SET {sets} WHERE id=%s", [*fields.values(), row_id])


def query(sql: str, params=()) -> list[dict]:
    with cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchall() if cur.description else []


def log_run(agent: str, task: str, summary: str) -> None:
    insert("agent_runs", {"agent": agent, "task": task[:2000], "summary": summary[:8000]})
