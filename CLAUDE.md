# Certificate Master - Project Overview

**Last Updated**: 2026-01-06

## 📋 Project Summary

**Certificate Master (자격증 마스터)** is an all-in-one platform providing certificate information, personalized study plans, and AI guidance.

- **Status**: MVP Development (Week 1-2)
- **Target**: 자격증 준비 중인 모든 사람
- **Business Model**: Free (initial), Premium subscription + Ads (later)

---

## 🎯 Core Value Proposition

**자격증 정보 + 맞춤형 학습 플랜 + AI 가이드** in one place

### Key Features (MVP)
1. ✅ **Certificate Search & Details** - API-based enriched data
2. ✅ **Google OAuth Authentication** - Secure social login
3. ✅ **Session Management** - Auto session sync & logout
4. 🚧 **Study Progress Tracking** - AI milestones + check-ins
5. 🔜 **Community** (Optional) - Tag-based forum

---

## 🏗️ Tech Stack

### Backend
- **Framework**: Python FastAPI
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Google OAuth)
- **Package Manager**: uv
- **API Documentation**: OpenAPI/Swagger

**Key Technologies**:
- Pydantic for data validation
- SQLAlchemy ORM
- Pytest for testing

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand (with persist)
- **Data Fetching**: TanStack Query (React Query)
- **Testing**: Playwright (E2E)
- **Language**: TypeScript

**Key Features**:
- Google OAuth integration
- Infinite scroll search
- Autocomplete with debouncing
- Session management with useAuth hook

### Deployment
- **Local**: Supabase CLI + Docker
- **Backend**: Docker container (FastAPI)
- **Frontend**: Docker/Vercel
- **Database**: Supabase (local + cloud)

---

## 📁 Project Structure

```
certificate-master/
├── backend/              # Python FastAPI Backend
│   ├── app/              # Application code
│   │   ├── api/v1/      # API endpoints
│   │   ├── core/        # Config, database, security
│   │   ├── schemas/     # Pydantic models
│   │   └── services/    # Business logic
│   ├── scripts/         # Data processing scripts
│   ├── tests/           # Unit & integration tests
│   ├── CLAUDE.md        # Backend development guide
│   └── README.md        # Backend setup
│
├── frontend/            # Next.js Frontend
│   ├── src/
│   │   ├── app/         # App Router pages
│   │   ├── components/  # UI components
│   │   ├── hooks/       # Custom hooks (useAuth, useCertificates)
│   │   ├── lib/         # API client, utils
│   │   └── stores/      # Zustand stores
│   ├── tests/e2e/       # Playwright E2E tests
│   ├── CLAUDE.md        # Frontend development guide
│   └── README.md        # Frontend setup
│
├── docs/                # Documentation
│   ├── cert-plan.md     # Original project plan
│   ├── plan-template.md # Planning template
│   └── SKILL.md         # Feature planner skill
│
├── CLAUDE.md            # This file (main guide)
└── SESSION_MANAGEMENT_IMPLEMENTATION.md  # Session management docs
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+ with uv
- Node.js 18+
- Supabase CLI
- Docker (for Supabase)

### Backend Setup
```bash
cd backend
uv sync --extra dev
cp .env.example .env
# Edit .env with your Supabase credentials
uv run uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with Supabase URL and keys
npm run dev
```

### Supabase Setup
```bash
# Start local Supabase
supabase start

# Get credentials
supabase status -o env

# Run migrations
supabase db reset
```

---

## 📚 Detailed Documentation

### Development Guides
- **[Backend Guide](./backend/CLAUDE.md)** - API development, database schema, testing
- **[Frontend Guide](./frontend/CLAUDE.md)** - Components, hooks, state management, E2E tests
- **[Session Management](./SESSION_MANAGEMENT_IMPLEMENTATION.md)** - Authentication & session flow

### Setup & Configuration
- **[Backend README](./backend/README.md)** - Installation & running
- **[Frontend README](./frontend/README.md)** - Installation & running

### Project Planning
- **[Project Plan](./docs/cert-plan.md)** - Original MVP planning
- **[Plan Template](./docs/plan-template.md)** - Feature planning template

---

## ✨ Recent Updates (2026-01-06)

### Implemented Features
1. **Google OAuth Authentication** ✅
   - Single authentication method (email/password removed)
   - Automatic session management
   - OAuth callback handling
   - 14/14 E2E tests passing

2. **Session Management** ✅
   - useAuth hook for global auth state
   - SessionProvider for app-wide sync
   - Auto session check on app load
   - Real-time auth state changes
   - 23/31 tests passing (8 require real login)

3. **Study Plan Button** ✅
   - "학습 계획 만들기" button on certificate detail page
   - Login check before adding to study plan
   - Redirect to /login if not authenticated
   - 2/2 E2E tests passing

4. **Type Safety Improvements** ✅
   - Fixed TypeError in type guards (optional chaining)
   - All type guards now handle undefined arrays safely

### Test Coverage
- **Frontend E2E**: 125+ tests, ~94% passing
- **Backend**: Unit & integration tests

---

## 🎯 Development Status

### ✅ Completed
- [x] Backend API (Schema V2)
- [x] Certificate search with autocomplete
- [x] Infinite scroll pagination
- [x] Google OAuth login
- [x] Session management
- [x] Certificate detail page
- [x] Study plan button (UI only)
- [x] E2E test suite
- [x] Debouncing (300ms)

### 🚧 In Progress
- [ ] Study plan CRUD API
- [ ] Study plan dashboard UI
- [ ] Check-in functionality

### 🔜 Planned
- [ ] AI-generated study plans
- [ ] Progress tracking
- [ ] Community forum
- [ ] Notifications

---

## 🛠️ Development Workflow

### Code Style
- **Python**: Black formatter, Ruff linter, Type hints required
- **TypeScript**: Prettier, ESLint, Strict mode

### Git Conventions
```
feat: New feature
fix: Bug fix
refactor: Code refactoring
docs: Documentation
test: Test code
```

### Testing Strategy
- **TDD Approach**: RED (test) → GREEN (implement) → VERIFY (run tests)
- **Backend**: pytest (unit + integration)
- **Frontend**: Playwright (E2E)
- **Target Coverage**: 80%+ for business logic

---

## 🔐 Environment Variables

### Backend (.env)
```env
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<from supabase status>
SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
SUPABASE_DB_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 📊 Success Metrics (MVP)

1. ✅ 100+ certificates in database (enriched with AI)
2. ✅ Search functionality working
3. ✅ Google OAuth authentication
4. 🚧 AI-generated study plans
5. 🔜 Progress tracking functional
6. 🔜 Deployed and accessible

---

## 🤝 Contributing

This project follows TDD (Test-Driven Development):
1. Write failing tests first
2. Implement minimal code to pass tests
3. Verify tests pass
4. Refactor if needed

See individual component guides for detailed development instructions:
- [Backend Development](./backend/CLAUDE.md)
- [Frontend Development](./frontend/CLAUDE.md)

---

## 📞 Support & Resources

- **Backend API Docs**: http://localhost:8000/docs (when running)
- **Supabase Studio**: http://localhost:54323 (local)
- **Frontend Dev Server**: http://localhost:3000

For detailed technical documentation, refer to the component-specific CLAUDE.md files in `backend/` and `frontend/` directories.

---

**Author**: Claude Sonnet 4.5
**Project Status**: ✅ MVP Phase 1 Complete (Search + Auth)
**Next Phase**: Study Plan Features
