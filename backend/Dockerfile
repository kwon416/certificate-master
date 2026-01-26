# Backend Dockerfile - Python FastAPI (Optimized with BuildKit cache)
# syntax=docker/dockerfile:1.4

FROM python:3.11-slim AS base

# Set working directory
WORKDIR /app

# Create non-root user first
RUN useradd -m -u 1000 appuser

# Install system dependencies (캐시 레이어)
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast package management (캐시 레이어)
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install uv

# Copy dependency files first (레이어 캐싱)
COPY pyproject.toml uv.lock ./

# Install dependencies with cache mount (핵심 최적화)
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --no-dev --frozen

# Copy application code with correct ownership
COPY --chown=appuser:appuser app ./app
COPY --chown=appuser:appuser scripts ./scripts

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
