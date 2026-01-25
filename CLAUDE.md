# Certificate Master - Project Overview

**Last Updated**: 2026-01-25

## Project Summary

**Certificate Master (자격증 마스터)** is an all-in-one platform providing certificate information, personalized study plans, and AI guidance.

- **Status**: MVP Development (Active)
- **Target**: 자격증 준비 중인 모든 사람
- **Business Model**: Free (initial), Premium subscription + Ads (later)
- **Dev Server**: https://dev-cert.i-ve.ai

---

## Core Value Proposition

**자격증 정보 + 맞춤형 학습 플랜 + AI 가이드** in one place

### Key Features
1. **Certificate Search & Details** - API-based enriched data with autocomplete
2. **Google OAuth Authentication** - Secure social login via Supabase
3. **AI-Powered Recommendations** - RAG-based certificate recommendations
4. **Study Plan Management** - LLM-generated personalized study plans
5. **Check-in & Progress Tracking** - Daily check-ins with analytics
6. **Learning Analytics** - Progress metrics, patterns, and insights

---

## Tech Stack

### Backend
- **Framework**: Python FastAPI
- **Database**: MariaDB (SQLAlchemy ORM + PyMySQL)
- **Auth**: Supabase Auth (Google OAuth)
- **Vector DB**: ChromaDB + BGE-M3 Embeddings
- **LLM**: OpenAI GPT-4o-mini
- **Search**: Brave Search API
- **Package Manager**: uv
- **API Documentation**: OpenAPI/Swagger

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Testing**: Playwright (E2E)

### Deployment
- **Container**: Docker + Docker Compose
- **Backend**: FastAPI container (port 8000)
- **Frontend**: Next.js container (port 5100)
- **Database**: MariaDB (external)
- **Vector Store**: ChromaDB (external server)

---

## Project Structure

```
certificate-master/
├── backend/                    # Python FastAPI Backend
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── certificates.py    # Certificate CRUD & search
│   │   │   │   ├── study_plans.py     # Study plan management
│   │   │   │   ├── checkins.py        # Check-in tracking
│   │   │   │   ├── analytics.py       # Learning pattern API
│   │   │   │   ├── progress_analytics.py
│   │   │   │   └── recommendations.py # RAG recommendations
│   │   │   ├── deps.py                # Dependencies
│   │   │   └── chroma.py              # ChromaDB API
│   │   ├── core/
│   │   │   ├── config.py              # Settings (Pydantic)
│   │   │   ├── database.py            # MariaDB connection
│   │   │   ├── security.py            # Auth middleware
│   │   │   └── supabase.py            # Supabase client
│   │   ├── models/                    # SQLAlchemy models
│   │   │   ├── certificate.py
│   │   │   ├── study_plan.py
│   │   │   └── checkin.py
│   │   ├── schemas/                   # Pydantic schemas
│   │   │   ├── certificate.py
│   │   │   ├── study_plan.py
│   │   │   ├── checkin.py
│   │   │   ├── analytics.py
│   │   │   └── recommendation.py
│   │   ├── services/                  # Business logic
│   │   │   ├── analytics_service.py
│   │   │   ├── learning_pattern_service.py
│   │   │   ├── study_plan_service.py
│   │   │   ├── recommendation_service.py
│   │   │   ├── embedding_service.py
│   │   │   ├── vector_store.py
│   │   │   ├── llm_service.py
│   │   │   ├── brave_search.py
│   │   │   ├── enrichment_service.py
│   │   │   └── velocity_calculator.py
│   │   ├── utils/
│   │   └── main.py                    # FastAPI entrypoint
│   ├── data/
│   │   ├── raw/                       # Raw CSV data
│   │   └── processed/                 # Processed JSON data
│   ├── scripts/                       # Data processing scripts
│   │   ├── parse_csv.py
│   │   ├── enrich_certificates.py
│   │   ├── generate_embeddings.py
│   │   ├── seed_certificates.py
│   │   └── database/                  # SQL migrations
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── docs/
│   ├── CLAUDE.md
│   ├── README.md
│   └── pyproject.toml
│
├── frontend/                   # Next.js Frontend
│   ├── src/
│   │   ├── app/                       # App Router pages
│   │   │   ├── page.tsx               # Landing page
│   │   │   ├── search/                # Search + AI recommend
│   │   │   ├── certificates/[id]/     # Certificate detail
│   │   │   ├── dashboard/             # User dashboard
│   │   │   ├── study-plans/           # Study plan pages
│   │   │   ├── analytics/             # Analytics page
│   │   │   ├── login/                 # Login page
│   │   │   ├── auth/callback/         # OAuth callback
│   │   │   ├── community/             # Community (placeholder)
│   │   │   ├── privacy/               # Privacy policy
│   │   │   └── terms/                 # Terms of service
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── auth/                  # Auth components
│   │   │   ├── certificate/           # Certificate components
│   │   │   ├── recommend/             # AI recommend wizard
│   │   │   ├── study-plan/            # Study plan components
│   │   │   ├── dashboard/             # Dashboard widgets
│   │   │   ├── analytics/             # Analytics components
│   │   │   ├── landing/               # Landing page components
│   │   │   ├── layout/                # Header, Footer
│   │   │   └── providers/             # SessionProvider
│   │   ├── hooks/
│   │   │   ├── use-auth.ts
│   │   │   ├── use-certificates.ts
│   │   │   ├── use-study-plans.ts
│   │   │   ├── use-checkins.ts
│   │   │   ├── use-recommendations.ts
│   │   │   ├── use-analytics.ts
│   │   │   ├── use-velocity-metrics.ts
│   │   │   └── use-debounce.ts
│   │   ├── lib/
│   │   │   ├── api/                   # API client & types
│   │   │   ├── supabase/              # Supabase clients
│   │   │   ├── providers.tsx
│   │   │   └── utils.ts
│   │   └── stores/
│   │       ├── auth-store.ts
│   │       ├── search-store.ts
│   │       └── recommend-store.ts
│   ├── tests/e2e/                     # Playwright tests
│   ├── public/
│   ├── CLAUDE.md
│   ├── README.md
│   ├── playwright.config.ts
│   └── package.json
│
├── deploy/                     # Deployment configuration
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   ├── docker-compose.yml
│   ├── docker-compose.backend.yml
│   ├── deploy-backend.sh
│   ├── deploy-frontend.sh
│   ├── deploy.sh
│   ├── ecosystem.config.js
│   └── README.md
│
├── docs/                       # Documentation
│   ├── cert-plan.md
│   ├── plan-template.md
│   ├── RAG_RECOMMENDATION_PLAN.md
│   ├── PINECONE_DATA_PIPELINE.md
│   └── CLAUDE.md
│
├── CLAUDE.md                   # This file
├── AGENTS.md                   # AI agent guidelines
└── .gitignore
```

---

## Quick Start

### Prerequisites
- Python 3.11+ with uv
- Node.js 18+
- Docker (for deployment)
- MariaDB (or use Docker)
- ChromaDB server (or use Docker)

### Backend Setup
```bash
cd backend
uv sync --extra dev
cp .env.example .env
# Edit .env with your credentials
uv run uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.sample .env.local
# Edit .env.local with your settings
npm run dev
```

### Docker Deployment
```bash
cd deploy
docker-compose build
docker-compose up -d
```

---

## API Endpoints

### Certificates
- `GET /api/v1/certificates/search` - Search certificates
- `GET /api/v1/certificates/autocomplete` - Autocomplete suggestions
- `GET /api/v1/certificates/categories` - Get categories
- `GET /api/v1/certificates/series` - Get series by category
- `GET /api/v1/certificates/{id}` - Get certificate details

### Study Plans
- `GET /api/v1/study-plans` - List user's study plans
- `POST /api/v1/study-plans` - Create study plan (LLM-generated)
- `GET /api/v1/study-plans/{id}` - Get study plan details
- `PATCH /api/v1/study-plans/{id}` - Update study plan
- `DELETE /api/v1/study-plans/{id}` - Delete study plan

### Check-ins
- `GET /api/v1/checkins` - List check-ins
- `POST /api/v1/checkins` - Create check-in
- `GET /api/v1/checkins/{study_plan_id}/stats` - Check-in statistics
- `GET /api/v1/checkins/{study_plan_id}/streak` - Current streak

### Analytics
- `GET /api/v1/analytics/progress/{study_plan_id}` - Progress analytics
- `GET /api/v1/analytics/learning-pattern/{study_plan_id}` - Learning patterns

### Recommendations
- `POST /api/v1/recommendations` - Get AI recommendations

### ChromaDB
- `GET /chroma/stats` - Vector store statistics
- `GET /chroma/search` - Semantic search

---

## Environment Variables

### Backend (.env)
```env
# Supabase (Auth)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# MariaDB
MARIADB_HOST=localhost
MARIADB_PORT=3306
MARIADB_USER=your-user
MARIADB_PASSWORD=your-password
MARIADB_DATABASE=certificate_master

# ChromaDB
CHROMA_HOST=db01.server.ivetech.co.kr
CHROMA_PORT=38000
CHROMA_COLLECTION_NAME=certificate-master-index

# APIs
OPENAI_API_KEY=sk-...
BRAVE_API_KEY=BSA...

# Application
ENVIRONMENT=development
DEBUG=true
CORS_ORIGINS=http://localhost:3000,http://localhost:5100
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Development Workflow

### Code Style
- **Python**: Black formatter, Ruff linter, Type hints required
- **TypeScript**: ESLint, Strict mode
- **Indentation**: 2 spaces (TS/TSX), 4 spaces (Python)

### Git Conventions
```
feat: New feature
fix: Bug fix
refactor: Code refactoring
docs: Documentation
test: Test code
chore: Maintenance
```

### Testing
```bash
# Backend
uv run pytest                           # All tests
uv run pytest tests/unit               # Unit tests
uv run pytest tests/integration        # Integration tests

# Frontend
npm test                               # All E2E tests
npm run test:ui                        # Interactive mode
npm run test:headed                    # With browser
```

---

## Key Features Implementation

### 1. RAG-based Recommendations
- 5-step interaction wizard (field, goal, experience, time, duration)
- ChromaDB vector search with BGE-M3 embeddings
- Match score calculation based on similarity and feasibility

### 2. LLM Study Plan Generation
- GPT-4o-mini generates personalized milestones and topics
- Considers certificate difficulty, user's daily hours, target date
- Automatic week-by-week breakdown

### 3. Learning Analytics
- Completion rate, time adherence, schedule adherence
- Learning pattern analysis (preferred time slots, consistency)
- Risk signal detection (streak broken, mood deterioration)

### 4. Check-in System
- Daily study hour logging with mood tracking
- Streak calculation for motivation
- AI encouragement messages based on mood

---

## Testing Status

### Backend
- Unit tests: 100+ tests
- Integration tests: 30+ tests
- Test framework: pytest

### Frontend
- E2E tests: 22 test files, 150+ tests
- Key areas: Landing, Search, Recommend, Auth, Dashboard, Study Plans
- Test framework: Playwright

---

## Documentation

- **[Backend Guide](./backend/CLAUDE.md)** - API development, services, testing
- **[Frontend Guide](./frontend/CLAUDE.md)** - Components, hooks, E2E tests
- **[Deploy Guide](./deploy/README.md)** - Docker deployment instructions
- **[RAG Plan](./docs/RAG_RECOMMENDATION_PLAN.md)** - Recommendation system design

---

## Resources

- **Backend API Docs**: http://localhost:8000/docs (local)
- **Frontend Dev**: http://localhost:3000 (local)
- **Dev Server**: https://dev-cert.i-ve.ai

---

**Author**: Development Team
**Project Status**: MVP Phase 2 (AI Features)
