FROM python:3.11-slim
WORKDIR /app
COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt flask
COPY api/ ./api/
COPY server.py .
EXPOSE 8000
CMD ["python", "server.py"]
