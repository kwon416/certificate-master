# Repository Guidelines

## Project Structure & Module Organization

This repository is split into a Next.js frontend and a FastAPI backend.

- `frontend/`: Next.js app (App Router), UI components, and Playwright E2E tests.
- `frontend/src/`: application source (`app/`, `components/`, `lib/`, `stores/`, `hooks/`).
- `frontend/tests/e2e/`: Playwright specs (e.g., `search.spec.ts`).
- `backend/`: FastAPI service, data pipeline, and pytest tests.
- `backend/app/`: API routes, schemas, core config, and FastAPI entrypoint.
- `backend/scripts/`: data processing and seeding utilities.

## Build, Test, and Development Commands

Frontend (run in `frontend/`):
- `npm run dev`: start Next.js dev server.
- `npm run build`: production build.
- `npm run test`: Playwright E2E suite.

Backend (run in `backend/`):
- `uv sync --extra dev`: install dependencies.
- `uv run uvicorn app.main:app --reload --port 8000`: start API locally.
- `uv run pytest`: run all backend tests.

## Coding Style & Naming Conventions

- Frontend: TypeScript + React; follow Next.js conventions. Components use `PascalCase` filenames (e.g., `certificate-card.tsx`), hooks use `use-*.ts`.
- Backend: Python 3.11+; format with `black` and lint with `ruff`.
- Indentation: 2 spaces for TS/TSX, 4 spaces for Python.
- Linting: `npm run lint` (frontend), `uv run ruff check app/ scripts/ tests/` (backend).

## Testing Guidelines

- Frontend: Playwright E2E tests under `frontend/tests/e2e/`.
  Example: `npm run test -- tests/e2e/search.spec.ts`.
- Backend: pytest tests under `backend/tests/`.
  Example: `uv run pytest tests/unit`.
- No explicit coverage threshold is enforced; add tests for new behavior.

## Commit & Pull Request Guidelines

- Git history shows short, sentence-style messages without a strict prefix
  (e.g., "Add Playwright E2E tests for TDD frontend development").
- Use concise, imperative summaries; mention the area when helpful.
- PRs: include a short description, steps to verify, and UI screenshots
  for frontend changes.

## Security & Configuration Tips

- Backend requires `backend/.env` with Supabase keys; do not commit secrets.
- Local URLs: frontend `http://localhost:3000`, backend `http://localhost:8000`.
