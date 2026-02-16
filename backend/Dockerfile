# Backend Dockerfile - Python FastAPI (Multi-stage, BuildKit 불필요)

# ============================================================
# Stage 1: Builder - 의존성 설치 (build-essential 포함)
# ============================================================
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system dependencies for building C extensions
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast package management
RUN pip install uv

# Copy dependency files first (Docker 레이어 캐싱 활용)
# pyproject.toml/uv.lock이 변경되지 않으면 이 아래 레이어는 캐시 hit
COPY pyproject.toml uv.lock ./

# Install dependencies
# --no-dev: 개발 의존성 제외
# --frozen: lockfile 기반 정확한 버전 설치
RUN uv sync --no-dev --frozen

# ============================================================
# Stage 2: Runner - 최소 런타임 이미지
# ============================================================
FROM python:3.11-slim AS runner

WORKDIR /app

# Install runtime-only dependencies (curl for healthcheck)
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv (uv run 명령에 필요)
RUN pip install uv

# Create non-root user
RUN useradd -m -u 1000 appuser

# Copy virtual environment from builder (COPY --chown으로 chown -R 대체)
COPY --from=builder --chown=appuser:appuser /app/.venv ./.venv

# Copy dependency files (uv run에 필요)
COPY --chown=appuser:appuser pyproject.toml uv.lock ./

# Copy application code
COPY --chown=appuser:appuser app ./app
COPY --chown=appuser:appuser scripts ./scripts

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
