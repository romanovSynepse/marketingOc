# Сборка из корня репозитория (см. docker-compose.yml): агентам нужен общий мозг SynOC.
FROM python:3.11-slim
WORKDIR /app
COPY dashboard/agents/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY CLAUDE.md shared/CLAUDE.md
COPY brain/synoc-marketer-instruction.md shared/brain/synoc-marketer-instruction.md
COPY dashboard/agents/brain/ ./brain/
COPY dashboard/agents/synteam/ ./synteam/
COPY dashboard/agents/data/ ./data/
CMD ["python", "-m", "synteam", "worker"]
