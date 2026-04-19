## Context

This is a greenfield MVP for an integrated life planning platform targeting individuals and families who need to coordinate across financial management, goal tracking, habit building, and progress visualization. The system must support web (primary) and mobile (PWA) clients communicating with a Python REST API backed by PostgreSQL and Redis.

**Key Constraints:**
- MVP scope: user auth, goal management, habit tracking, financial budgeting, progress dashboard
- Must support future family accounts (role-based access)
- Multi-platform: React web, React Native/PWA mobile via shared API
- Security: JWT authentication, data encryption, GDPR compliance path

## Goals / Non-Goals

**Goals:**
- Deliver a working MVP with core user flows: register → create goals → track habits → view dashboard
- Establish clean API contract between frontend and backend
- Enable rapid iteration with straightforward deployment pipeline
- Lay foundation for family accounts, financial projections, and risk assessment (Should Have)

**Non-Goals:**
- Bank account integration (Could Have, future)
- Native mobile apps (PWA only for MVP)
- Advanced gamification (Could Have, future)
- AI-powered recommendations (Won't Have, future)

## Decisions

### 1. Frontend: React.js with Vite + Context API + Bootstrap

**Decision:** Use React.js with Vite for fast development, Context API for state management (over Redux), and Bootstrap 5 for responsive UI components.

**Rationale:** Vite provides superior DX with fast HMR and minimal config. Context API is sufficient for MVP complexity—Redux adds unnecessary boilerplate. Bootstrap accelerates UI development with proven responsive components.

**Alternatives Considered:**
- Next.js: Adds SSR complexity not needed for MVP; can migrate later if SEO becomes critical
- Redux Toolkit: Useful for larger apps but overkill for MVP scope

### 2. Backend: Flask (over Django)

**Decision:** Use Flask as the Python web framework.

**Rationale:** Flask's minimalist design allows us to add components as needed without fighting framework conventions. For an MVP with defined endpoints, Flask provides flexibility without Django's opinionated structure. Django can be adopted later if admin interface or ORM conventions become valuable.

**Alternatives Considered:**
- Django: Rich ecosystem but heavier; better suited when admin interface and built-in auth are needed immediately
- FastAPI: Excellent for async APIs, but Flask's ecosystem (SQLAlchemy, etc.) is more mature for our stack

### 3. Database: PostgreSQL + Redis

**Decision:** PostgreSQL for persistent relational data; Redis for session caching and transient data (streak calculations, rate limiting).

**Rationale:** PostgreSQL handles complex queries (goal progress aggregation, budget summaries) better than SQLite. Redis provides sub-millisecond access for frequently-read, frequently-written data like habit streaks and session tokens.

**Alternatives Considered:**
- SQLite: Insufficient for concurrent users; no connection pooling
- MongoDB: Less suited for structured relational data like budgets and goals

### 4. API Design: RESTful with JSON

**Decision:** RESTful endpoints returning JSON, following resource-based URL conventions.

**Rationale:** Industry standard, well-understood by frontend developers, easy to test with curl/Postman. GraphQL considered but adds query complexity without MVP benefit.

**URL Structure:**
```
/api/v1/auth/register
/api/v1/auth/login
/api/v1/auth/refresh
/api/v1/goals
/api/v1/goals/{id}
/api/v1/goals/{id}/progress
/api/v1/habits
/api/v1/habits/{id}
/api/v1/habits/{id}/complete
/api/v1/budgets
/api/v1/budgets/{id}/expenses
/api/v1/dashboard
```

### 5. Authentication: JWT with Access/Refresh Tokens

**Decision:** JWT access tokens (15min expiry) + refresh tokens (7 day expiry) stored in httpOnly cookies.

**Rationale:** Stateless authentication scales horizontally. Short-lived access tokens limit exposure; refresh tokens enable session continuity. httpOnly cookies prevent XSS token theft.

**Alternatives Considered:**
- Session-based: Requires shared session store; scales poorly without Redis (which we have, but JWT avoids session lookup)
- OAuth 2.0: Overkill for MVP; adds complexity without benefit until third-party login needed

### 6. Project Structure

**Decision:** Monorepo with `frontend/` and `backend/` directories at root.

**Rationale:** Simple, allows easy path to splitting into separate repos if teams scale. Shared CI/CD pipeline.

```
lifeplanning/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── tests/
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── hooks/
│   │   └── utils/
│   ├── public/
│   ├── tests/
│   ├── package.json
│   └── vite.config.js
└── openspec/
```

## Risks / Trade-offs

**[Risk] No native mobile app** → PWA provides mobile web access; native apps require separate effort post-MVP

**[Risk] Flask may need restructuring for complex features** → Django or FastAPI migration path exists; start with clean service layer architecture to ease future refactoring

**[Risk] Redis adds infrastructure dependency** → Essential for streak calculations and session caching; can be optional for MVP with in-memory fallback

**[Risk] Family accounts require role-based access design now** → Keep role field on User model; implement basic checks in routes; defer complex permission system

## Migration Plan

**Phase 1: Project Setup**
1. Initialize monorepo structure
2. Set up PostgreSQL database schema
3. Configure Redis for development
4. Wire up CI/CD with GitHub Actions

**Phase 2: Backend API**
1. Implement auth endpoints (register, login, refresh)
2. Build goal CRUD with milestones
3. Build habit CRUD with streak tracking
4. Build budget and expense endpoints
5. Create dashboard aggregation endpoint

**Phase 3: Frontend**
1. Scaffold React + Vite project
2. Implement auth flow (register, login, protected routes)
3. Build goal management UI
4. Build habit tracking UI
5. Build budget UI
6. Build dashboard with charts

**Rollback:** Git tags at each phase; feature flags disable new functionality if issues arise

## Open Questions

1. **PWA vs React Native**: PWA is faster to ship; native provides better notifications and offline. Decision: PWA for MVP, evaluate RN post-launch.
2. **Bootstrap vs Tailwind**: Bootstrap is faster to prototype; Tailwind is more customizable. Decision: Bootstrap for MVP speed.
3. **Bank Integration**: No MVP benefit; defer to future. Architecture should not preclude it.
4. **Email for verification**: Include email verification step or defer? Decision: MVP allows unverified accounts; email verification in future phase.