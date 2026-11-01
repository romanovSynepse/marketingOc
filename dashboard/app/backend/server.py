"""Flask wrapper around the serverless handler for local/Docker use."""
from flask import Flask, request, Response
import json
import os
from pathlib import Path
from api.index import handler, get_conn

app = Flask(__name__)

STATE_COMMIT = Path("/state/commit")   # пишет deploy/autodeploy.sh после успешного деплоя
REPO_GIT = Path("/repo-git")           # .git сервера (только чтение), запасной источник хэша


def deployed_commit() -> str:
    if STATE_COMMIT.exists():
        return STATE_COMMIT.read_text().strip()[:12]
    head = REPO_GIT / "HEAD"
    if not head.exists():
        return "unknown"
    ref = head.read_text().strip()
    if not ref.startswith("ref: "):
        return ref[:12]
    ref = ref[5:]
    loose = REPO_GIT / ref
    if loose.exists():
        return loose.read_text().strip()[:12]
    packed = REPO_GIT / "packed-refs"
    if packed.exists():
        for line in packed.read_text().splitlines():
            if line.endswith(" " + ref):
                return line.split()[0][:12]
    return "unknown"


@app.route("/healthz")
def healthz():
    """Публичная проверка деплоя: только статус, хэш коммита и доступность базы. Никаких данных."""
    try:
        conn = get_conn()
        conn.cursor().execute("SELECT 1")
        conn.close()
        db = "ok"
    except Exception:
        db = "down"
    body = {"status": "ok" if db == "ok" else "degraded", "commit": deployed_commit(), "backend": "ok", "db": db}
    return Response(json.dumps(body), status=200 if db == "ok" else 503,
                    headers={"Content-Type": "application/json", "Cache-Control": "no-store"})

@app.route("/", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
def main():
    event = {
        "httpMethod": request.method,
        "queryStringParameters": dict(request.args) or {},
        "body": request.get_data(as_text=True) or None,
    }
    result = handler(event, None)
    return Response(
        result.get("body", ""),
        status=result.get("statusCode", 200),
        headers=result.get("headers", {}),
    )

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
