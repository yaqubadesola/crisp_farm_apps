# CrispFarm — Catfish Farm Management System

A full-stack, multi-tenant SaaS application for managing catfish farm operations: production cycles, sales, customer pricing, expenses, and daily analytics — all behind a role-based access system.

> **For a deep dive into architecture decisions, module design, data flows, and the contribution guide, see [ARCHITECTURE.md](./ARCHITECTURE.md).**

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start — Docker](#quick-start--docker)
- [Environment Variables](#environment-variables)
- [Default Credentials](#default-credentials)
- [Application Pages](#application-pages)
- [API Overview](#api-overview)
- [Project Structure](#project-structure)
- [CI/CD & Deployment](#cicd--deployment)
- [Development (Without Docker)](#development-without-docker)
- [Adding a New Module](#adding-a-new-module)
- [Known Constraints](#known-constraints)

---

## Features

| Module | What it does |
|---|---|
| **Authentication** | JWT login, role-based access (ADMIN / FARM_MANAGER / SALES_OFFICER / ACCOUNTANT) |
| **Dashboard** | Today's revenue, volume, transactions; 7-day trend chart |
| **Production Cycles** | Track grow-out cycles from stocking to harvest |
| **Sales** | Record sales with pricing tier override; admin can edit any sale |
| **Customers** | Customer registry with dynamic, configurable customer types |
| **Pricing Tiers** | Configurable per-kg prices per customer type |
| **Expenses** | Log and categorise farm expenses per cycle |
| **Reports** | Date-range revenue/volume summaries; unpaid invoice list |
| **Inventory** | Track feed, medication, and equipment stock levels |
| **Debts** | Track unpaid credit sales and record partial payments |
| **User Management** | Admin-only: create and manage staff accounts |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Spring Boot 3.2.4, Java 17, Spring Security, JJWT 0.12.6, Bucket4j 8.10.1 |
| **Database** | PostgreSQL 16, Flyway migrations, Hibernate (validate mode) |
| **Frontend** | Next.js 15.5.18 (App Router), TypeScript, Tailwind CSS |
| **State** | Zustand (auth/UI), TanStack Query v5 (server state) |
| **HTTP** | Axios with JWT interceptor and auto-logout on 401 |
| **Charts** | Recharts |
| **Runtime** | Docker Compose (three services: db, backend, frontend) |
| **CI/CD** | GitHub Actions → Render (backend) + Vercel (frontend) |

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 4.x or later
- Ports **3000**, **8080**, and **5432** free on your machine

> **Windows users:** If Maven fails to resolve dependencies during the first build, open Docker Desktop → Settings → Docker Engine and add `"dns": ["8.8.8.8", "8.8.4.4"]` to the JSON, then Apply & Restart.

---

## Quick Start — Docker

```bash
# 1. Clone the repository
git clone https://github.com/yaqubadesola/crisp_farm_apps.git
cd crisp_farm_apps

# 2. Create your environment file
cp .env.example .env
# Edit .env — set JWT_SECRET and ADMIN_INITIAL_PASSWORD (both required)

# 3. Build and start all three services
docker compose up --build

# 4. Open the app
# Frontend  →  http://localhost:3000
# Backend   →  http://localhost:8080/api
```

The first run takes ~3–5 minutes while Docker pulls base images and Maven downloads dependencies. Subsequent starts are much faster.

```bash
# Stop (data volume preserved)
docker compose down

# Full reset including database
docker compose down -v
```

---

## Environment Variables

Copy `.env.example` to `.env` before running. Variables marked **Required** will cause startup failure if missing.

| Variable | Description | Required | Default (dev) |
|---|---|---|---|
| `JWT_SECRET` | HMAC-SHA signing key — min 32 chars | **Yes** | fallback string (change in production) |
| `ADMIN_INITIAL_PASSWORD` | Password for seeded admin account (first startup only) | **Yes** | none — must be set |
| `DB_URL` | JDBC connection string | Yes | `jdbc:postgresql://db:5432/farm_db` |
| `DB_USERNAME` | PostgreSQL username | Yes | `farm_user` |
| `DB_PASSWORD` | PostgreSQL password | Yes | `farm_pass` |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowed origins | No | `http://localhost:3000` |
| `JWT_EXPIRATION_MS` | Token lifetime in milliseconds | No | `86400000` (24h) |
| `NEXT_PUBLIC_API_URL` | API base URL — **baked in at build time** | Yes | `http://localhost:8080/api` |

> `NEXT_PUBLIC_API_URL` is a Next.js build-time constant. Changing it requires a frontend image rebuild (`docker compose build frontend`).

> `ALLOWED_ORIGINS` supports wildcard patterns (e.g. `https://*.vercel.app`) because Spring's `setAllowedOriginPatterns` is used internally.

---

## Default Credentials

`DataSeeder` creates an admin account on the very **first** startup. The password is read from `ADMIN_INITIAL_PASSWORD` in your `.env` file.

| Field | Value |
|---|---|
| **Username** | `crispfarm` |
| **Password** | whatever you set in `ADMIN_INITIAL_PASSWORD` |
| **Role** | `ADMIN` |

Create additional staff accounts from the **Users** page after logging in as admin.

---

## Application Pages

| Path | Roles | Description |
|---|---|---|
| `/login` | Public | JWT login form |
| `/dashboard` | All | Daily KPIs and 7-day trend chart |
| `/cycles` | ADMIN, FARM_MANAGER | List, create, harvest, close production cycles |
| `/sales/new` | ADMIN, SALES_OFFICER | Record new sale with pricing tier selector |
| `/sales` | ADMIN, SALES_OFFICER, ACCOUNTANT | Paginated sales history; admin can edit any sale |
| `/customers` | ADMIN, SALES_OFFICER | Customer list, registration, dynamic customer types |
| `/pricing` | ADMIN | Configure per-kg prices per tier |
| `/expenses` | ADMIN, FARM_MANAGER, ACCOUNTANT | Log and filter expenses by cycle |
| `/inventory` | ADMIN, FARM_MANAGER | Stock items, record usage and purchases |
| `/debts` | ADMIN, SALES_OFFICER, ACCOUNTANT | Outstanding invoices, record payments |
| `/reports` | ADMIN, FARM_MANAGER, ACCOUNTANT | Revenue/volume/expense reports |
| `/users` | ADMIN | Create and manage staff accounts |

---

## API Overview

All endpoints are prefixed `/api`. The backend is at `http://localhost:8080/api`.

Protected endpoints require `Authorization: Bearer <token>`.

```
POST   /auth/login                   — obtain JWT (rate-limited: 5 req/min per IP)

GET    /dashboard/today              — today's KPIs
GET    /dashboard/trend              — 7-day sales trend

GET    /cycles                       — list cycles
POST   /cycles                       — create cycle (ADMIN, FARM_MANAGER)
POST   /cycles/{id}/harvest          — record harvest
POST   /cycles/{id}/close            — close cycle (ADMIN)
GET    /cycles/{id}/profit           — cycle P&L summary

GET    /sales?from=&to=&page=&size=  — paginated sales list
POST   /sales                        — record a sale (supports pricingTierName override)
GET    /sales/{id}                   — sale detail
PUT    /sales/{id}                   — update sale (ADMIN only)
GET    /sales/unpaid                 — unpaid invoices

GET    /customers                    — list customers
POST   /customers                    — create customer
PUT    /customers/{id}               — update customer

GET    /pricing/tiers                — list pricing tiers
PUT    /pricing/tiers/{tierName}     — update price (ADMIN)

GET    /expenses                     — list expenses
POST   /expenses                     — log expense

POST   /payments                     — record debt payment (ADMIN, ACCOUNTANT)
GET    /debts                        — all outstanding debts

GET    /inventory/items              — list inventory items
POST   /inventory/items              — create item
POST   /inventory/transactions       — record stock IN/OUT

GET    /reports/range?from=&to=      — aggregated P&L report
GET    /reports/breakdown?from=&to=  — day-by-day breakdown

GET    /users                        — list users (ADMIN)
POST   /users                        — create user (ADMIN)
```

Full request/response shapes are documented in [ARCHITECTURE.md — API Reference](./ARCHITECTURE.md#8-api-reference).

---

## Project Structure

```
crisp_farm_apps/
├── .github/
│   └── workflows/
│       ├── deploy.yml              # CI/CD: test → staging → production
│       └── deploy-flyio.yml.example
├── backend/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/crispfarm/
│       │   ├── FarmManagementApplication.java  (@EnableScheduling)
│       │   ├── common/             # BaseEntity, ApiResponse, TenantContext
│       │   ├── config/
│       │   │   ├── JwtAuthFilter.java
│       │   │   ├── JwtService.java
│       │   │   ├── LoginRateLimiterService.java  ← rate limiter (Bucket4j)
│       │   │   └── SecurityConfig.java           ← CORS from ALLOWED_ORIGINS env
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── customer/       # + CustomerTypeRepository (dynamic types)
│       │   │   ├── cycle/
│       │   │   ├── expense/
│       │   │   ├── inventory/
│       │   │   ├── payment/
│       │   │   ├── pond/
│       │   │   ├── pricing/
│       │   │   ├── report/
│       │   │   ├── sales/
│       │   │   │   └── dto/
│       │   │   │       ├── CreateSaleRequest.java  (+ pricingTierName)
│       │   │   │       ├── UpdateSaleRequest.java  ← new
│       │   │   │       └── SaleDto.java
│       │   │   ├── tenant/
│       │   │   └── user/
│       │   └── seed/DataSeeder.java  (password from ADMIN_INITIAL_PASSWORD)
│       └── resources/
│           ├── application.yml
│           └── db/migration/
│               ├── V1__init_schema.sql
│               ├── V2__add_missing_columns.sql
│               └── V3__add_sale_items_created_at.sql
├── frontend/
│   ├── Dockerfile                  (sets BUILD_STANDALONE=true)
│   ├── next.config.ts              (standalone output conditional on BUILD_STANDALONE)
│   ├── package.json                (Next.js 15.5.18)
│   └── src/
│       ├── app/
│       │   ├── (auth)/login/
│       │   └── (app)/
│       │       ├── layout.tsx      (pt-14 md:pt-0 for mobile header)
│       │       ├── sales/page.tsx  (+ admin edit modal)
│       │       ├── sales/new/      (+ pricing tier selector)
│       │       └── ...other pages
│       ├── components/layout/
│       │   └── Sidebar.tsx         (mobile drawer + hamburger menu)
│       ├── lib/
│       └── types/index.ts
├── docker-compose.yml
├── .env.example                    # template — copy to .env
├── .gitignore
├── ARCHITECTURE.md
└── README.md
```

---

## CI/CD & Deployment

### Branch strategy

```
feature/* ──▶ PR ──▶ develop ──▶ STAGING  (auto-deploy, no approval)
                         │
                         └──▶ PR ──▶ main ──▶ PRODUCTION  (requires approval)
```

### Free hosting stack

| Service | Platform | Notes |
|---|---|---|
| **Database** | [Neon](https://neon.tech) | Free PostgreSQL with branch support |
| **Backend** | [Render](https://render.com) | Docker deploy; free tier sleeps after 15 min |
| **Frontend** | [Vercel](https://vercel.com) | Native Next.js; auto-deploys per branch |
| **CI/CD** | GitHub Actions | Tests on every push; approval gate for production |

### Required environment variables per deployment

| Variable | Staging (Render) | Production (Render) | Vercel (Preview) | Vercel (Production) |
|---|---|---|---|---|
| `DB_URL` | Neon staging branch | Neon main branch | — | — |
| `DB_USERNAME` | Neon staging user | Neon main user | — | — |
| `DB_PASSWORD` | Neon staging pass | Neon main pass | — | — |
| `JWT_SECRET` | any strong string | **different** strong string | — | — |
| `ADMIN_INITIAL_PASSWORD` | staging password | production password | — | — |
| `ALLOWED_ORIGINS` | `https://*.vercel.app` | `https://*.vercel.app` | — | — |
| `NEXT_PUBLIC_API_URL` | — | — | staging backend URL | production backend URL |

### GitHub Actions secrets required

| Secret | Environment | Value |
|---|---|---|
| `RENDER_DEPLOY_HOOK_URL` | `staging` | Deploy hook URL from Render staging service |
| `RENDER_DEPLOY_HOOK_URL` | `production` | Deploy hook URL from Render production service |

---

## Development (Without Docker)

### Backend

```bash
cd backend

# Requires Java 17 and a running PostgreSQL instance
export JWT_SECRET=local-dev-secret
export ADMIN_INITIAL_PASSWORD=yourpassword
export ALLOWED_ORIGINS=http://localhost:3000

./mvnw spring-boot:run
# Starts on http://localhost:8080
```

### Frontend

```bash
cd frontend
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8080/api" > .env.local

npm run dev
# Starts on http://localhost:3000
```

---

## Adding a New Module

The full step-by-step guide is in [ARCHITECTURE.md — Adding a New Module](./ARCHITECTURE.md#10-adding-a-new-module). The short version:

1. **Migration** — create `V{n}__add_{module}_table.sql` in `db/migration/`
2. **Entity** — extend `BaseEntity`, annotate with `@SuperBuilder`
3. **Repository** — extend `JpaRepository`, always add `findByIdAndTenantId`
4. **DTO + Service** — filter by `TenantContext.get()` on every query
5. **Controller** — use `@RequestMapping("/{module}")` (no `/api/` prefix)
6. **Frontend** — add types in `types/index.ts`, query hook, page in `app/(app)/`

---

## Known Constraints

- **`ADMIN_INITIAL_PASSWORD` required** — `docker compose up` will fail immediately if this variable is not set in `.env`. This is intentional — the password must never fall back to a default.
- **Single login lookup** — user lookup at auth time is by username only; usernames must be unique across all tenants.
- **JPQL null parameters (PostgreSQL)** — `(:param IS NULL OR ...)` patterns cause `42P18` type inference errors. Always pass non-null defaults and use `BETWEEN`.
- **Zustand hydration** — `localStorage` reads are asynchronous. All authenticated layouts must guard with a `mounted` state before checking the token to avoid redirect-on-refresh.
- **`BigDecimal` as string** — Spring's default JSON serializer outputs `BigDecimal` as a quoted string. Wrap with `Number()` before arithmetic in the frontend.
- **`NEXT_PUBLIC_*` build-time baking** — changing the API URL requires a frontend image rebuild.
- **Login rate limit** — 5 attempts per IP per minute. In development behind a shared NAT, all developers share one IP. If you hit the limit locally, wait 1 minute.

---

## License

MIT
