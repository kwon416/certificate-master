# Documentation - Certificate Master

## Overview

This directory contains all project documentation including planning docs, API specifications, and architecture decisions.

---

## Directory Structure

```
docs/
├── plans/                    # Implementation plans
│   ├── auth-implementation.md
│   ├── search-feature.md
│   └── study-plan-ai.md
├── api/                      # API documentation
│   ├── endpoints.md
│   └── authentication.md
├── architecture/             # Architecture decisions
│   ├── supabase-migration.md
│   └── tech-stack.md
└── CLAUDE.md                 # This file
```

---

## API Documentation

### Authentication

**Endpoint**: Handled by Supabase Auth
**Base URL**: `<supabase-url>/auth/v1`

#### Sign Up
```http
POST /auth/v1/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123!"
}
```

#### Sign In
```http
POST /auth/v1/token?grant_type=password
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123!"
}
```

---

### Backend API Endpoints

**Base URL**: `http://localhost:8000/api/v1`

#### Search Certificates
```http
GET /certificates/search?q=세무사&limit=10
Authorization: Bearer {access_token}
```

#### Get Certificate Details
```http
GET /certificates/{id}
Authorization: Bearer {access_token}
```

#### Create Study Plan
```http
POST /study-plans
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "certificate_id": "uuid",
  "target_date": "2025-12-31",
  "daily_hours": 2.5
}
```

---

## Architecture Decisions

### Why Supabase?

**Rationale**:
1. **Faster Development**: Built-in auth, storage, realtime
2. **Better DX**: Supabase Studio for database management
3. **Row Level Security**: Built-in RLS
4. **Type Safety**: Auto-generate TypeScript types
5. **Local Development**: Full stack in Docker

**Trade-offs**:
- Vendor lock-in (mitigated by PostgreSQL compatibility)
- Learning curve
- Limited control over auth flow

---

### Why Local Docker?

**Rationale**:
1. **Cost**: No cloud costs during development
2. **Speed**: Faster iteration
3. **Offline**: Can develop without internet
4. **Consistency**: Same environment for all developers

---

## Supabase Migration Guide

### Pre-Migration Checklist
- [ ] Supabase CLI installed
- [ ] Docker Desktop running
- [ ] Environment variables configured
- [ ] Database schema designed

### Migration Steps

1. **Initialize Supabase**
```bash
supabase init
```

2. **Create Initial Migration**
```bash
supabase migration new initial_schema
```

3. **Apply Migration**
```bash
supabase db reset
```

4. **Generate Types**
```bash
supabase gen types typescript --local > frontend/src/types/database.types.ts
```

---

## Development Workflow

### Daily Development
1. Start Supabase: `supabase start`
2. Start backend: `cd backend && uvicorn app.main:app --reload`
3. Start frontend: `cd frontend && npm run dev`
4. Open Supabase Studio: http://localhost:54323

---

## Resources

### Supabase Docs
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

### Next.js + Supabase
- [Next.js App Router with Supabase](https://supabase.com/docs/guides/auth/server-side/nextjs)
