# Backend Dockerfile - Python FastAPI (Multi-stage optimized)
# syntax=docker/dockerfile:1.4

# ============================================================
# Stage 1: Builder - 의존성 설치 (build-essential 포함)
# ============================================================
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system dependencies for building C extensions
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast package management
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install uv

# Copy dependency files first (레이어 캐싱)
COPY pyproject.toml uv.lock ./

# Install dependencies with cache mount (핵심 최적화)
# --no-dev: 개발 의존성 제외
# --frozen: lockfile 기반 정확한 버전 설치
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --no-dev --frozen

# ============================================================
# Stage 2: Runner - 최소 런타임 이미지
# ============================================================
FROM python:3.11-slim AS runner

WORKDIR /app

# Install runtime-only dependencies (curl for healthcheck)
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 appuser

# Copy virtual environment from builder (이미 올바른 소유권으로)
COPY --from=builder --chown=appuser:appuser /app/.venv ./.venv

# Copy application code
COPY --chown=appuser:appuser app ./app
COPY --chown=appuser:appuser scripts ./scripts

# Copy dependency files (uv run에 필요)
COPY --chown=appuser:appuser pyproject.toml uv.lock ./

# Install uv in runner (uv run 명령에 필요)
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install uv

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
