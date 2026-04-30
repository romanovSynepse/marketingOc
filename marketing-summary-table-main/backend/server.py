"""Flask wrapper around the serverless handler for local/Docker use."""
from flask import Flask, request, Response
import json
from api.index import handler

app = Flask(__name__)

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
