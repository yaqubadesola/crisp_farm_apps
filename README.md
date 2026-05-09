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
- [Development (Without Docker)](#development-without-docker)
- [Adding a New Module](#adding-a-new-module)
- [Known Constraints](#known-constraints)

---

## Features

| Module | What it does |
|---|---|
| **Authentication** | JWT login, role-based access (ADMIN / CASHIER) |
| **Dashboard** | Today's revenue, volume, transactions; 7-day trend chart |
| **Production Cycles** | Track grow-out cycles from start to completion |
| **Sales** | Record sales, auto-price from tier, generate invoice numbers |
| **Customers** | Customer registry with type-based pricing tiers |
| **Pricing Tiers** | Configurable per-kg prices (RETAIL, WHOLESALE, BULK, VIP) |
| **Expenses** | Log and categorise farm expenses per cycle |
| **Reports** | Date-range revenue/volume summaries; unpaid invoice list |
| **User Management** | Admin-only: create and manage staff accounts |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Spring Boot 3.2.4, Java 17, Spring Security, JJWT 0.12.6 |
| **Database** | PostgreSQL 16, Flyway migrations, Hibernate (validate mode) |
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| **State** | Zustand (auth/UI), TanStack Query v5 (server state) |
| **HTTP** | Axios with JWT interceptor and auto-logout on 401 |
| **Charts** | Recharts |
| **Runtime** | Docker Compose (three services: db, backend, frontend) |

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 4.x or later
- Ports **3000**, **8080**, and **5432** free on your machine

> **Windows users:** If Maven fails to resolve dependencies during the first build, open Docker Desktop → Settings → Docker Engine and add `"dns": ["8.8.8.8", "8.8.4.4"]` to the JSON, then Apply & Restart.

---

## Quick Start — Docker

```bash
# 1. Clone the repository
git clone <repo-url>
cd farm_management_system

# 2. Create your environment file
cp .env.example .env
# Edit .env and set a strong JWT_SECRET (min 32 chars)

# 3. Build and start all three services
docker compose up --build

# 4. Open the app
# Frontend  →  http://localhost:3000
# Backend   →  http://localhost:8080/api
```

The first run takes ~3–5 minutes while Docker pulls base images and Maven downloads dependencies. Subsequent starts are much faster.

To stop and remove containers (data volume is preserved):

```bash
docker compose down
```

To also remove the database volume (full reset):

```bash
docker compose down -v
```

---

## Environment Variables

Copy `.env.example` to `.env` before running.

| Variable | Description | Default (dev) |
|---|---|---|
| `JWT_SECRET` | HMAC-SHA signing key — **change in production** | `local-dev-secret-please-change-in-production!!` |
| `DB_URL` | JDBC connection string | `jdbc:postgresql://db:5432/farm_db` |
| `DB_USERNAME` | PostgreSQL username | `farm_user` |
| `DB_PASSWORD` | PostgreSQL password | `farm_pass` |
| `NEXT_PUBLIC_API_URL` | API base URL (embedded at **build time**) | `http://localhost:8080/api` |

> `NEXT_PUBLIC_API_URL` is a Next.js build-time constant. If you change it, you must rebuild the frontend image (`docker compose build frontend`).

---

## Default Credentials

Flyway seeds an initial tenant and admin account on first startup.

| Field | Value |
|---|---|
| **Username** | `admin` |
| **Password** | `admin123` |
| **Role** | `ADMIN` |

Create additional cashier accounts from the **Users** page after logging in as admin.

---

## Application Pages

| Path | Role | Description |
|---|---|---|
| `/login` | Public | JWT login form |
| `/dashboard` | All | Daily KPIs and 7-day trend chart |
| `/cycles` | All | List, create, complete production cycles |
| `/sales` | All | Record sales; view paginated history |
| `/customers` | All | Customer list and registration |
| `/pricing` | ADMIN | Manage per-kg pricing tiers |
| `/expenses` | All | Log expenses; filter by cycle |
| `/reports` | All | Revenue/volume reports; unpaid invoices |
| `/users` | ADMIN | Create and manage user accounts |

---

## API Overview

All endpoints are prefixed `/api`. The backend is at `http://localhost:8080/api`.

Protected endpoints require `Authorization: Bearer <token>`.

```
POST   /auth/login                   — obtain JWT
POST   /auth/register                — create user (ADMIN only)

GET    /dashboard/today              — today's KPIs
GET    /dashboard/trend              — 7-day sales trend

GET    /cycles                       — list cycles
POST   /cycles                       — create cycle
PATCH  /cycles/{id}/complete         — mark complete
GET    /cycles/{id}/profit-summary   — revenue vs expenses

GET    /sales?from=&to=&page=&size=  — paginated sales list
POST   /sales                        — record a sale
GET    /sales/{id}                   — sale detail
GET    /sales/unpaid                 — unpaid invoices

GET    /customers                    — list customers
POST   /customers                    — create customer

GET    /pricing-tiers                — list pricing tiers
POST   /pricing-tiers                — create tier (ADMIN)
PUT    /pricing-tiers/{id}           — update tier (ADMIN)

GET    /expenses?cycleId=            — list expenses
POST   /expenses                     — log expense

GET    /reports/summary?from=&to=    — aggregated report

GET    /users                        — list users (ADMIN)
POST   /users                        — create user (ADMIN)
```

Full request/response shapes are documented in [ARCHITECTURE.md — API Reference](./ARCHITECTURE.md#12-api-reference).

---

## Project Structure

```
farm_management_system/
├── backend/                    # Spring Boot application
│   ├── src/main/java/com/crispfarm/
│   │   ├── config/             # Security, CORS, JWT filter
│   │   ├── common/             # BaseEntity, ApiResponse, TenantContext, exceptions
│   │   └── modules/            # auth, cycle, customer, dashboard, expense,
│   │                           # pricing, reports, sales, user (vertical slices)
│   ├── src/main/resources/
│   │   ├── db/migration/       # V1 (schema), V2, V3 (ALTER TABLE patches)
│   │   └── application.yml
│   └── Dockerfile
├── frontend/                   # Next.js application
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/         # /login route (no sidebar)
│   │   │   └── (app)/          # authenticated routes with sidebar layout
│   │   ├── components/         # Sidebar, shared UI primitives
│   │   └── lib/                # auth store (Zustand), apiClient (Axios), query hooks
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
├── ARCHITECTURE.md             # Full developer documentation
└── README.md                   # This file
```

---

## Development (Without Docker)

### Backend

```bash
cd backend

# Requires Java 17 and a running PostgreSQL instance
# Set environment variables or edit application.yml

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

The full step-by-step guide is in [ARCHITECTURE.md — Adding a New Module](./ARCHITECTURE.md#11-adding-a-new-module). The short version:

1. **Migration** — create `V{n}__add_{module}_table.sql` in `db/migration/`
2. **Entity** — extend `BaseEntity`, annotate with `@SuperBuilder`
3. **Repository** — extend `JpaRepository`, add `findByIdAndTenantId`
4. **DTO + Service** — filter by `TenantContext.get()` on every query
5. **Controller** — use `@RequestMapping("/{module}")` (no `/api/` prefix)
6. **Frontend** — add query hook in `lib/`, add page in `app/(app)/`

---

## Known Constraints

- **Single login lookup** — user lookup at auth time is by username only; usernames must be unique across all tenants.
- **JPQL null parameters (PostgreSQL)** — `(:param IS NULL OR ...)` patterns cause `42P18` type inference errors. Always pass non-null defaults and use `BETWEEN`.
- **Zustand hydration** — `localStorage` reads are asynchronous. All authenticated layouts must guard with a `mounted` state before checking the token to avoid redirect-on-refresh.
- **`BigDecimal` as string** — Spring's default JSON serializer outputs `BigDecimal` as a quoted string. Wrap with `Number()` before arithmetic in the frontend.
- **`NEXT_PUBLIC_*` build-time baking** — changing the API URL requires a frontend image rebuild.

---

## License

MIT
