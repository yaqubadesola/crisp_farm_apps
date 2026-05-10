# Farm Management System — Architecture & Developer Guide

> A multi-tenant SaaS platform for managing catfish farm operations: sales, cycles, inventory, expenses, debt tracking, and analytics.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack & Rationale](#2-technology-stack--rationale)
3. [Repository Layout](#3-repository-layout)
4. [Backend Architecture](#4-backend-architecture)
   - 4.1 [Package Structure](#41-package-structure)
   - 4.2 [Multi-Tenancy Design](#42-multi-tenancy-design)
   - 4.3 [Security & Authentication](#43-security--authentication)
   - 4.4 [Domain Modules](#44-domain-modules)
   - 4.5 [Database Schema](#45-database-schema)
   - 4.6 [Flyway Migrations](#46-flyway-migrations)
   - 4.7 [Data Seeding](#47-data-seeding)
5. [Frontend Architecture](#5-frontend-architecture)
   - 5.1 [App Router Layout](#51-app-router-layout)
   - 5.2 [State Management](#52-state-management)
   - 5.3 [API Layer](#53-api-layer)
   - 5.4 [Type System](#54-type-system)
6. [Data Flow Walkthroughs](#6-data-flow-walkthroughs)
7. [Infrastructure & Docker](#7-infrastructure--docker)
8. [API Reference](#8-api-reference)
9. [Role-Based Access Control](#9-role-based-access-control)
10. [Adding a New Module](#10-adding-a-new-module)
11. [Environment Variables](#11-environment-variables)
12. [Known Constraints & Design Decisions](#12-known-constraints--design-decisions)

---

## 1. System Overview

The Farm Management System is built as a **multi-tenant SaaS application** — one deployed instance can serve multiple farm businesses, each with fully isolated data. The architecture follows a classic three-tier pattern:

```
┌─────────────────────────────────────────────────────┐
│                  Browser (Port 3000)                 │
│              Next.js 15 + React 19 + TS              │
│         TanStack Query · Zustand · Recharts          │
└────────────────────┬────────────────────────────────┘
                     │  HTTP/REST  (Bearer JWT)
┌────────────────────▼────────────────────────────────┐
│               Backend (Port 8080/api)                │
│           Spring Boot 3.2.4 · Java 17                │
│     Spring Security · Spring Data JPA · Flyway       │
└────────────────────┬────────────────────────────────┘
                     │  JDBC
┌────────────────────▼────────────────────────────────┐
│             PostgreSQL 16  (Port 5432)               │
│                Shared Schema · Row-Level             │
│              Tenant Isolation via tenant_id           │
└─────────────────────────────────────────────────────┘
```

All three services are containerised and orchestrated with Docker Compose.

---

## 2. Technology Stack & Rationale

### Backend

| Technology | Version | Why |
|---|---|---|
| Java | 17 (LTS) | Long-term support, modern language features (records, sealed classes), widely hosted |
| Spring Boot | 3.2.4 | Battle-tested, opinionated convention over configuration, strong ecosystem |
| Spring Data JPA / Hibernate | 6.4.4 | Reduces boilerplate for CRUD; JPQL enables portable queries |
| Spring Security | 6.x | Declarative method-level authorisation; extensible filter chain |
| Flyway | 9.x | Versioned, repeatable schema migrations tied to code deployments |
| PostgreSQL | 16 | ACID compliance, excellent JSON/array support for future needs, reliable |
| Lombok | 1.18.x | Eliminates boilerplate getters/setters/builders — `@SuperBuilder` critical for inheritance |
| JJWT | 0.12.6 | Lightweight, well-maintained JWT library for stateless auth |
| BCrypt | (Spring) | Industry-standard adaptive password hashing |

### Frontend

| Technology | Version | Why |
|---|---|---|
| Next.js | 15.3.1 | App Router, SSR/SSG, file-based routing, standalone output for Docker |
| React | 19 | Concurrent rendering, latest hooks API |
| TypeScript | 5 | Type safety across entire frontend; catches API contract mismatches at compile time |
| TanStack Query | v5 | Server-state cache, automatic background refresh, stale-while-revalidate |
| Zustand | v5 | Minimal auth state store with `persist` middleware (localStorage) |
| Axios | 1.7 | Interceptors for automatic Bearer token injection and 401 handling |
| Tailwind CSS | 3.4 | Utility-first; no runtime CSS-in-JS overhead |
| Recharts | 2.13 | Composable, React-native charts built on D3 |
| date-fns | 4 | Tree-shakable, immutable date utilities |

### Infrastructure

| Technology | Why |
|---|---|
| Docker + Docker Compose | Reproducible local dev; parity with production |
| Multi-stage Dockerfile (backend) | JDK in build stage, JRE-only in runtime image — smaller final image |
| Multi-stage Dockerfile (frontend) | `output: 'standalone'` strips dev dependencies from runtime image |

---

## 3. Repository Layout

```
farm_management_system/
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/crispfarm/
│       │   ├── FarmManagementApplication.java
│       │   ├── common/
│       │   │   ├── base/BaseEntity.java
│       │   │   ├── dto/
│       │   │   │   ├── ApiResponse.java
│       │   │   │   └── PageResponse.java
│       │   │   ├── exception/
│       │   │   │   ├── ApiException.java
│       │   │   │   └── GlobalExceptionHandler.java
│       │   │   └── tenant/TenantContext.java
│       │   ├── config/
│       │   │   ├── JwtAuthFilter.java
│       │   │   ├── JwtService.java
│       │   │   └── SecurityConfig.java
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── customer/
│       │   │   ├── cycle/
│       │   │   ├── expense/
│       │   │   ├── inventory/
│       │   │   ├── payment/
│       │   │   ├── pond/
│       │   │   ├── pricing/
│       │   │   ├── report/
│       │   │   ├── sales/
│       │   │   ├── tenant/
│       │   │   └── user/
│       │   └── seed/DataSeeder.java
│       └── resources/
│           ├── application.properties
│           └── db/migration/
│               ├── V1__init_schema.sql
│               ├── V2__add_missing_columns.sql
│               └── V3__add_sale_items_created_at.sql
├── frontend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── next.config.ts
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── app/
│       │   ├── (auth)/login/page.tsx
│       │   ├── (app)/
│       │   │   ├── layout.tsx
│       │   │   ├── dashboard/page.tsx
│       │   │   ├── customers/page.tsx
│       │   │   ├── sales/page.tsx
│       │   │   ├── sales/new/page.tsx
│       │   │   ├── cycles/page.tsx
│       │   │   ├── expenses/page.tsx
│       │   │   ├── inventory/page.tsx
│       │   │   ├── pricing/page.tsx
│       │   │   ├── reports/page.tsx
│       │   │   ├── debts/page.tsx
│       │   │   └── users/page.tsx
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── providers.tsx
│       ├── components/layout/Sidebar.tsx
│       ├── lib/
│       │   ├── api.ts
│       │   ├── auth.ts
│       │   └── utils.ts
│       └── types/index.ts
├── docker-compose.yml
├── README.md
└── ARCHITECTURE.md
```

---

## 4. Backend Architecture

### 4.1 Package Structure

The backend follows a **vertical slice / module-per-domain** organisation rather than a horizontal layer organisation. Each business domain owns its entity, repository, service, controller, and DTOs together:

```
com.crispfarm.modules.sales/
├── Sale.java               ← @Entity
├── SaleItem.java           ← @Entity (child)
├── SalesRepository.java    ← Spring Data JPA
├── SalesService.java       ← Business logic (@Transactional)
├── SalesController.java    ← REST endpoints
└── dto/
    ├── CreateSaleRequest.java
    └── SaleDto.java
```

**Why vertical slices?** When a developer is tasked with "add a discount to sales", they work entirely inside `modules/sales/` — no navigating across unrelated packages. This reduces cognitive overhead and merge conflicts on feature branches.

Cross-cutting concerns live in `common/` (response wrappers, exceptions, base entity, tenant context) and `config/` (security, JWT).

---

### 4.2 Multi-Tenancy Design

**Strategy: Shared schema, row-level isolation**

Every business entity table has a `tenant_id BIGINT NOT NULL` column referencing `tenants(id)`. All queries are filtered by the current tenant, which is stored in a `ThreadLocal` on each request.

#### The flow:

```
Request arrives
     │
     ▼
JwtAuthFilter.doFilterInternal()
     │  parse JWT → extract tenantId claim
     ▼
TenantContext.set(tenantId)      ← ThreadLocal write
     │
     ▼
Controller → Service
     │  all queries include: WHERE tenant_id = TenantContext.get()
     ▼
finally: TenantContext.clear()   ← prevent thread pool leakage
```

#### BaseEntity

Every entity extends `BaseEntity`, which enforces the tenant column at the ORM level:

```java
@MappedSuperclass
@Getter @Setter @SuperBuilder @NoArgsConstructor
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private Long tenantId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
```

**`@SuperBuilder` is critical** — standard `@Builder` does not include parent class fields. Without `@SuperBuilder` on both `BaseEntity` and every child entity, `.tenantId(...)` in the builder chain would fail to compile.

#### Why shared schema (not separate schemas/databases per tenant)?

- **Operational simplicity**: one database to back up, monitor, and migrate
- **Current scale**: a catfish farm SaaS is unlikely to have thousands of tenants requiring row-level security (PostgreSQL RLS) overhead
- **Migration cost**: Flyway applies one migration to one schema — no per-tenant migration management
- **Tradeoff**: a severe bug could theoretically leak data between tenants. Mitigated by consistent `TenantContext` use and index enforcement.

---

### 4.3 Security & Authentication

#### JWT Authentication

The system uses **stateless JWT authentication**. No server-side session is maintained.

**Token structure** (claims):
```json
{
  "sub": "crispfarm",
  "role": "ADMIN",
  "tenantId": 1,
  "iat": 1746000000,
  "exp": 1746086400
}
```

**JwtService** generates and validates tokens using HMAC-SHA (HS256 by default via JJWT 0.12.x). The secret is injected from `app.jwt.secret` (environment variable `JWT_SECRET` in production).

**JwtAuthFilter** (`OncePerRequestFilter`):
1. Reads `Authorization: Bearer <token>` header
2. Parses and validates the JWT (signature + expiry)
3. Sets `TenantContext` from `tenantId` claim
4. Creates a `UsernamePasswordAuthenticationToken` and stores it in `SecurityContextHolder`
5. Calls `filterChain.doFilter()` to proceed
6. Clears `TenantContext` in `finally` block

**SecurityConfig** key decisions:
- `SessionCreationPolicy.STATELESS` — no `JSESSIONID` cookies
- CSRF disabled — not needed for stateless APIs consumed by SPAs
- `@EnableMethodSecurity` — allows `@PreAuthorize("hasAnyRole('ADMIN','...')")` on controller methods
- `/api/auth/**` is `permitAll`; everything else requires authentication
- Spring's `UserDetailsService` is **not** used — custom `JwtAuthFilter` does full authentication inline

#### Password Hashing

`BCryptPasswordEncoder` is configured as a Spring bean and injected wherever password operations occur. The `DataSeeder` uses it to hash the default admin password at startup.

---

### 4.4 Domain Modules

#### `auth`
Handles login only. Validates credentials, checks tenant status, returns a JWT.

```
POST /auth/login
  Body: { username, password }
  Returns: { token, username, fullName, role, tenantId, tenantName }
```

#### `user`
Manages system users within a tenant. Only `ADMIN` can create or deactivate users.

```
GET    /users          → PageResponse<UserDto>
POST   /users          → UserDto
PUT    /users/{id}     → UserDto
```

#### `customer`
Tracks farm customers. `CustomerType` drives pricing: `RETAIL → RETAIL tier`, `WHOLESALE → WHOLESALE tier`, etc. The `toPricingTier()` method on the enum bridges customer type to pricing lookup.

```
GET    /customers          → PageResponse<CustomerDto>
POST   /customers          → CustomerDto
PUT    /customers/{id}     → CustomerDto
```

#### `pricing`
Stores price-per-kg for each customer tier in NGN. `PricingTierService.getPriceForTier(tierName)` is a dependency of `SalesService` — every sale automatically uses the current tier price.

```
GET    /pricing/tiers      → List<PricingTierDto>
PUT    /pricing/tiers/{id} → PricingTierDto
```

#### `pond`
Represents physical fish ponds/tanks. Ponds are referenced by cycles.

```
GET    /ponds              → List<PondDto>
POST   /ponds              → PondDto
PUT    /ponds/{id}         → PondDto
```

#### `cycle`
Central to farm operations. A `FarmCycle` represents one batch of fish from stocking to harvest.

Lifecycle states:
```
ACTIVE  →  (harvest)  →  HARVESTED  →  (close)  →  CLOSED
```

On harvest: `actualYieldKg` is recorded, status → `HARVESTED`.
On close: status → `CLOSED`.

`CycleService.getProfit(cycleId)` aggregates:
- Revenue: `SalesRepository.sumRevenueByCycleId()`
- Expenses: `ExpenseRepository.sumByCycleId()`
- Net profit = revenue − expenses

```
GET    /cycles                    → List<FarmCycleDto>
POST   /cycles                    → FarmCycleDto
GET    /cycles/active             → List<FarmCycleDto>
POST   /cycles/{id}/harvest       → FarmCycleDto
POST   /cycles/{id}/close         → FarmCycleDto
GET    /cycles/{id}/mortalities   → List<MortalityDto>
POST   /cycles/{id}/mortalities   → MortalityDto
GET    /cycles/{id}/profit        → CycleProfitDto
```

#### `sales`
Creates sales transactions. Auto-prices based on customer type.

Sale creation flow:
1. Fetch customer → derive tier name
2. `PricingTierService.getPriceForTier(tier)` → unit price
3. `totalPrice = unitPrice × quantityKg`
4. `invoiceStatus = CREDIT payment? "UNPAID" : "PAID"`
5. Save `Sale` → auto-generate `invoiceNumber = INV-{year}-{id}`
6. Save `SaleItem`

```
POST   /sales        → SaleDto
GET    /sales        → PageResponse<SaleDto>  (from, to, page, size query params)
GET    /sales/{id}   → SaleDto
```

#### `expense`
Records operating costs, optionally linked to a cycle for per-cycle P&L.

```
POST   /expenses                    → ExpenseDto
GET    /expenses                    → PageResponse<ExpenseDto>
GET    /expenses/summary            → ExpenseSummaryDto
```

#### `payment`
Resolves credit sales (debts). A "debt" is a `Sale` where `invoiceStatus = UNPAID`. When payments reduce the balance to zero, the sale flips to `PAID`.

```
POST   /payments                   → PaymentDto
GET    /debts                      → DebtSummaryDto  (all outstanding debts)
GET    /sales/{saleId}/payments    → List<PaymentDto>
```

#### `inventory`
Tracks consumables (feed, medication, equipment). Supports `PURCHASE` (stock in), `USAGE` (stock out), and `ADJUSTMENT` (set exact quantity).

```
GET    /inventory/items            → List<InventoryItemDto>
POST   /inventory/items            → InventoryItemDto
POST   /inventory/transactions     → InventoryTransactionDto
GET    /inventory/transactions     → List<InventoryTransactionDto>
```

#### `report`
Read-only analytics aggregating data from other modules. All methods are `@Transactional(readOnly = true)`.

```
GET    /reports/range?from={}&to={}        → RangeReportDto
GET    /reports/breakdown?from={}&to={}   → List<DailySalesReportDto>
```

`RangeReportDto` contains: `totalRevenue`, `totalQuantityKg`, `salesCount`, `totalExpenses`, `netProfit`.

---

### 4.5 Database Schema

#### Entity Relationship Overview

```
tenants
  └── users           (tenant_id FK)
  └── customers       (tenant_id FK)
  └── pricing_tiers   (tenant_id FK)
  └── ponds           (tenant_id FK)
  └── cycles          (tenant_id FK, pond_id FK)
       └── cycle_mortalities  (tenant_id FK, cycle_id FK)
       └── expenses           (tenant_id FK, cycle_id FK nullable)
       └── sales              (tenant_id FK, cycle_id FK nullable, customer_id FK)
            └── sale_items    (tenant_id FK, sale_id FK)
            └── payments      (tenant_id FK, sale_id FK, customer_id FK)
  └── inventory_items (tenant_id FK)
       └── inventory_transactions (tenant_id FK, item_id FK, cycle_id FK nullable)
  └── audit_logs      (tenant_id FK)
```

#### Key Design Decisions

**`sale_items` exists even for single-item sales.** This allows future multi-item sales (different fish grades in one transaction) without a schema change.

**`cycle_id` is nullable on sales and expenses.** A farm may sell directly from stock without a formal cycle, or record expenses not tied to any cycle (e.g., office costs).

**`invoiceStatus` on `Sale` vs. a separate ledger.** For simplicity, debt is tracked on the sale itself. The `payments` table accumulates partial payments; when the sum of payments = `totalPrice`, status flips to `PAID`. This avoids a double-entry ledger for MVP.

**`customer_id` is stored on `Payment` (denormalised).** Although derivable via `sale_id → sale → customer_id`, direct storage enables faster "all payments by customer" queries without a join.

---

### 4.6 Flyway Migrations

Migrations live in `src/main/resources/db/migration/` and are applied automatically on startup.

| File | Purpose |
|---|---|
| `V1__init_schema.sql` | Creates all 13 tables, foreign keys, and performance indexes |
| `V2__add_missing_columns.sql` | Adds `created_at` to `pricing_tiers` (BaseEntity requirement) |
| `V3__add_sale_items_created_at.sql` | Adds `created_at` to `sale_items` (BaseEntity requirement) |

**Rule for contributors**: never modify an existing migration file after it has been applied to any environment. Always create a new `V{n+1}__description.sql` file.

`spring.jpa.hibernate.ddl-auto=validate` ensures Hibernate validates the schema against entity mappings at startup — any mismatch fails fast with a clear error.

---

### 4.7 Data Seeding

`DataSeeder` runs once on application start (via `ApplicationRunner`). It is **idempotent** — it checks for existence before inserting.

Default seed data:
- **Tenant**: CrispFarm (slug: `crispfarm`)
- **Admin user**: username `crispfarm`, password set via `ADMIN_INITIAL_PASSWORD` env var
- **Pricing tiers**:

| Tier | NGN/kg |
|---|---|
| RETAIL | 2,000 |
| WHOLESALE | 1,800 |
| HOTEL | 2,200 |
| DISTRIBUTOR | 1,600 |

> **Production note**: Change the admin password immediately after first login. The DataSeeder password is in plaintext in source code — suitable for development only.

---

## 5. Frontend Architecture

### 5.1 App Router Layout

The frontend uses **Next.js 15 App Router** with route groups for layout isolation:

```
app/
├── (auth)/           ← No sidebar; public routes
│   └── login/page.tsx
└── (app)/            ← Sidebar + auth guard; private routes
    ├── layout.tsx    ← Auth guard + Sidebar wrapper
    ├── dashboard/
    ├── customers/
    ├── sales/
    │   ├── page.tsx       (history + filters)
    │   └── new/page.tsx   (POS / new sale form)
    ├── cycles/
    ├── expenses/
    ├── inventory/
    ├── pricing/
    ├── reports/
    ├── debts/
    └── users/
```

The `(app)/layout.tsx` guard:

```tsx
const [mounted, setMounted] = useState(false)
useEffect(() => { setMounted(true) }, [])
useEffect(() => {
  if (mounted && !token) router.push('/login')
}, [token, router, mounted])

if (!mounted) return null   // Wait for Zustand hydration
if (!token) return null
```

**Why `mounted` state?** Zustand's `persist` middleware reads from `localStorage`, which is unavailable during server-side rendering or initial client render. Without the `mounted` guard, every page refresh would see `token = null` for one frame and redirect to `/login`. The `mounted` flag ensures we only check auth after client-side hydration is complete.

---

### 5.2 State Management

**Auth state** is the only global client state. It uses Zustand with the `persist` middleware:

```ts
// src/lib/auth.ts
export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      hasRole: (...roles) => roles.includes(get().user?.role ?? ''),
    }),
    { name: 'farm-auth' }  // key in localStorage
  )
)
```

**Server state** (API data) is managed entirely by **TanStack Query v5**:
- Each page uses `useQuery` for fetching and `useMutation` for writes
- Queries are keyed by entity + filters (e.g., `['sales', from, to, page]`)
- After a mutation, `queryClient.invalidateQueries` triggers automatic refetch
- No manual loading/error state — TanStack Query handles it

This separation (Zustand for auth, TanStack Query for server data) means there is no redundant caching and no stale data from a global store.

---

### 5.3 API Layer

`src/lib/api.ts` exports a pre-configured Axios instance:

```ts
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api',
})

// Inject Bearer token on every request
api.interceptors.request.use(config => {
  const token = useAuth.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, clear auth and redirect to login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      useAuth.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
```

**`NEXT_PUBLIC_API_URL` is a build-time variable.** Next.js bakes `NEXT_PUBLIC_*` variables into the JavaScript bundle at build time (not runtime). In Docker, this means it must be passed as a `build.args` entry in `docker-compose.yml`, not as a runtime `environment` entry. This is a subtle but critical distinction.

---

### 5.4 Type System

`src/types/index.ts` mirrors the backend DTOs as TypeScript interfaces. This is the single source of truth for the frontend's understanding of the API contract.

Key types:
```ts
interface ApiResponse<T> { success: boolean; message?: string; data: T }
interface PageResponse<T> { content: T[]; number: number; size: number; totalElements: number; totalPages: number }

type UserRole = 'ADMIN' | 'FARM_MANAGER' | 'SALES_OFFICER' | 'ACCOUNTANT'
type CustomerType = 'RETAIL' | 'WHOLESALE' | 'HOTEL' | 'DISTRIBUTOR'
type CycleStatus = 'ACTIVE' | 'HARVESTED' | 'CLOSED'

interface RangeReport {
  totalRevenue: string | number
  totalQuantityKg: string | number
  salesCount: number
  totalExpenses: string | number
  netProfit: string | number
}
```

> Note: `BigDecimal` values from the backend arrive as strings in JSON (e.g., `"2000.00"`). Always wrap with `Number(value)` or `parseFloat(value)` before arithmetic on the frontend.

---

## 6. Data Flow Walkthroughs

### 6.1 Creating a Sale (Happy Path)

```
Frontend (sales/new/page.tsx)
│
│  1. User selects customer, enters quantity kg, chooses payment method
│  2. api.post('/sales', { customerId, quantityKg, paymentMethod, cycleId? })
│
Backend (SalesController → SalesService)
│
│  3. JwtAuthFilter: parse JWT → TenantContext.set(1)
│  4. customerRepo.findByIdAndTenantId(customerId, tenantId) → Customer
│  5. customer.getCustomerType().toPricingTier() → "WHOLESALE"
│  6. pricingTierService.getPriceForTier("WHOLESALE") → 1800.00
│  7. totalPrice = 1800.00 × quantityKg
│  8. invoiceStatus = paymentMethod == "CREDIT" ? "UNPAID" : "PAID"
│  9. salesRepo.save(Sale) → returns saved entity with generated id
│  10. invoiceNumber = "INV-2026-000001"
│  11. SaleItem saved via cascade
│  12. return SaleDto
│
Frontend
│
│  13. TanStack Query mutation success → invalidate ['sales'] query
│  14. Sales history page auto-refetches
```

### 6.2 Request Lifecycle (Authentication)

```
Browser sends: GET /api/sales?from=2026-05-01&to=2026-05-08
               Authorization: Bearer eyJhbGc...

Spring Filter Chain:
  CorsFilter → JwtAuthFilter → UsernamePasswordAuthenticationFilter (skipped) → ...

JwtAuthFilter:
  1. Extract "eyJhbGc..." from header
  2. jwtService.parse(token) → Claims { sub="crispfarm", role="ADMIN", tenantId=1 }
  3. TenantContext.set(1L)
  4. SecurityContextHolder.set(new UsernamePasswordAuthenticationToken("crispfarm", null, [ROLE_ADMIN]))
  5. chain.doFilter()

SalesController.list():
  6. salesService.list(from, to, 0, 20)

SalesService.list():
  7. tenantId = TenantContext.get()  // → 1L
  8. salesRepo.findByTenantAndDateRange(1L, from, to, pageable)

JPQL: SELECT s FROM Sale s
      WHERE s.tenantId = 1
      AND s.saleDate BETWEEN '2026-05-01' AND '2026-05-08'
      ORDER BY s.saleDate DESC

JwtAuthFilter finally block:
  9. TenantContext.clear()
```

### 6.3 Dashboard Load

The dashboard fires **three parallel queries** using TanStack Query:

```ts
useQuery(['today-report'])        → GET /reports/range?from=today&to=today
useQuery(['weekly-report'])       → GET /reports/range?from=7daysAgo&to=today
useQuery(['report-breakdown'])    → GET /reports/breakdown?from=7daysAgo&to=today
```

Results are combined in the component to display KPI cards and a revenue bar chart. Parallel queries mean the dashboard fully loads in one round-trip time (the slowest of the three), not sequentially.

---

## 7. Infrastructure & Docker

### 7.1 Service Dependency Order

```
farm_db  (healthcheck: pg_isready)
    └──► farm_backend  (depends_on: db healthy; restart: on-failure)
              └──► farm_frontend  (depends_on: backend)
```

The backend has `restart: on-failure` because the first startup occasionally races the database health check. `depends_on: { db: { condition: service_healthy } }` helps but the extra restart is a safety net.

### 7.2 Backend Dockerfile (Multi-Stage)

```dockerfile
# Stage 1: Build
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN apk add --no-cache maven
RUN mvn -q dependency:go-offline -f pom.xml   # ← Cache layer: only re-runs if pom.xml changes
COPY src ./src
RUN mvn -q package -DskipTests

# Stage 2: Runtime (JRE only — ~100MB smaller than JDK)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

The `dependency:go-offline` step is a Docker layer cache optimisation. Maven downloads all dependencies into a cached layer. Subsequent builds only re-run Maven compile if `src/` changes — not if only a dependency version changes.

### 7.3 Frontend Dockerfile (Standalone)

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL   # baked into JS bundle here
RUN npm run build                              # produces .next/standalone

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

`output: 'standalone'` in `next.config.ts` generates a self-contained `server.js` with no `node_modules/` dependency — the runtime image needs only Node.

### 7.4 Volumes & Persistence

```yaml
volumes:
  farm_db_data:   # Named volume — survives container restart/recreation
```

Database data persists in a Docker-managed named volume. To fully reset the database (e.g., during development):
```bash
docker compose down -v   # removes volumes
docker compose up
```

---

## 8. API Reference

Base URL (local): `http://localhost:8080/api`

All protected endpoints require: `Authorization: Bearer <jwt>`

All responses follow: `{ "success": true/false, "message": "...", "data": <payload> }`

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | None | Login, returns JWT |

### Users

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/users` | All | List users (paginated) |
| POST | `/users` | ADMIN | Create user |
| PUT | `/users/{id}` | ADMIN | Update user |

### Customers

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/customers` | All | List customers |
| POST | `/customers` | ADMIN, FARM_MANAGER | Create customer |
| PUT | `/customers/{id}` | ADMIN, FARM_MANAGER | Update customer |

### Pricing

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/pricing/tiers` | All | List pricing tiers |
| PUT | `/pricing/tiers/{id}` | ADMIN | Update price per kg |

### Ponds

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/ponds` | All | List ponds |
| POST | `/ponds` | ADMIN, FARM_MANAGER | Create pond |
| PUT | `/ponds/{id}` | ADMIN, FARM_MANAGER | Update pond |

### Cycles

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/cycles` | All | List cycles |
| POST | `/cycles` | ADMIN, FARM_MANAGER | Create cycle |
| GET | `/cycles/active` | All | Active cycles only |
| POST | `/cycles/{id}/harvest` | ADMIN, FARM_MANAGER | Record harvest |
| POST | `/cycles/{id}/close` | ADMIN | Close cycle |
| GET | `/cycles/{id}/mortalities` | All | List mortalities |
| POST | `/cycles/{id}/mortalities` | All | Record mortality |
| GET | `/cycles/{id}/profit` | All | Cycle P&L |

### Sales

| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/sales` | ADMIN, FARM_MANAGER, SALES_OFFICER | Create sale |
| GET | `/sales` | All | List sales (from, to, page, size) |
| GET | `/sales/{id}` | All | Get sale with items |

### Expenses

| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/expenses` | ADMIN, FARM_MANAGER | Record expense |
| GET | `/expenses` | All | List expenses |
| GET | `/expenses/summary` | All | Summary by category |

### Payments / Debts

| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/payments` | ADMIN, ACCOUNTANT | Record payment |
| GET | `/debts` | All | Outstanding debts |
| GET | `/sales/{saleId}/payments` | All | Payments for a sale |

### Inventory

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/inventory/items` | All | List inventory items |
| POST | `/inventory/items` | ADMIN, FARM_MANAGER | Create item |
| POST | `/inventory/transactions` | All | Record IN/OUT |
| GET | `/inventory/transactions` | All | Transaction history |

### Reports

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/reports/range` | All | Revenue, expenses, profit for range |
| GET | `/reports/breakdown` | All | Day-by-day breakdown |

---

## 9. Role-Based Access Control

| Role | Capabilities |
|---|---|
| `ADMIN` | Full access to all modules including user management, pricing, cycle closure |
| `FARM_MANAGER` | Customers, ponds, cycles, sales, expenses, inventory. Cannot manage users or close cycles |
| `SALES_OFFICER` | Create sales, view customers, view inventory. Read-only on reports |
| `ACCOUNTANT` | Record payments, view all financial reports, read-only on operations |

Spring Security `@PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER')")` annotations on controller methods enforce these boundaries server-side.

---

## 10. Adding a New Module

Follow this checklist to add a new domain module (e.g., `vehicle`):

### 1. Database migration

```sql
-- V4__add_vehicles.sql
CREATE TABLE vehicles (
    id         BIGSERIAL PRIMARY KEY,
    tenant_id  BIGINT NOT NULL REFERENCES tenants(id),
    plate      VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, plate)
);
CREATE INDEX idx_vehicles_tenant ON vehicles(tenant_id);
```

### 2. Entity

```java
@Entity @Table(name = "vehicles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @SuperBuilder
public class Vehicle extends BaseEntity {
    @Column(nullable = false, length = 20) private String plate;
}
```

**Important**: Use `@SuperBuilder` (not `@Builder`) so that `.tenantId(...)` is available in the builder.

### 3. Repository

```java
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findAllByTenantId(Long tenantId);
    Optional<Vehicle> findByIdAndTenantId(Long id, Long tenantId);
}
```

### 4. DTOs

```java
public record VehicleDto(Long id, String plate, LocalDateTime createdAt) {
    public static VehicleDto from(Vehicle v) { return new VehicleDto(v.getId(), v.getPlate(), v.getCreatedAt()); }
}
public record SaveVehicleRequest(@NotBlank String plate) {}
```

### 5. Service

```java
@Service @RequiredArgsConstructor
public class VehicleService {
    private final VehicleRepository repo;

    public VehicleDto create(SaveVehicleRequest req) {
        Long tenantId = TenantContext.get();
        Vehicle v = Vehicle.builder().tenantId(tenantId).plate(req.plate()).build();
        return VehicleDto.from(repo.save(v));
    }

    public List<VehicleDto> list() {
        return repo.findAllByTenantId(TenantContext.get()).stream().map(VehicleDto::from).toList();
    }
}
```

### 6. Controller

```java
@RestController @RequestMapping("/vehicles") @RequiredArgsConstructor
public class VehicleController {
    private final VehicleService service;

    @GetMapping public ApiResponse<List<VehicleDto>> list() {
        return ApiResponse.success(service.list());
    }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<VehicleDto> create(@Valid @RequestBody SaveVehicleRequest req) {
        return ApiResponse.success(service.create(req));
    }
}
```

### 7. Frontend types

Add to `src/types/index.ts`:
```ts
interface Vehicle { id: number; plate: string; createdAt: string }
```

### 8. Frontend page

Create `src/app/(app)/vehicles/page.tsx` using `useQuery` and `useMutation` following the pattern in any existing page (e.g., `customers/page.tsx`).

---

## 11. Environment Variables

### Backend

| Variable | Default | Required in Production | Description |
|---|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/farm_db` | Yes | JDBC connection URL |
| `DB_USERNAME` | `farm_user` | Yes | Database user |
| `DB_PASSWORD` | `farm_pass` | Yes | Database password |
| `JWT_SECRET` | `crispfarm-secret-key-...` | **Yes** | HMAC signing secret (min 32 chars, prefer 64+) |
| `JWT_EXPIRATION_MS` | `86400000` (24h) | No | Token lifetime in milliseconds |
| `PORT` | `8080` | No | HTTP port |

### Frontend

| Variable | Default | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080/api` | **Build-time only** — must be passed as Docker `build.args`, not `environment` |

---

## 12. Known Constraints & Design Decisions

### Nullable Date Parameters in JPQL + PostgreSQL

PostgreSQL cannot infer the type of a `null` parameter bound to a date column via JPQL (`(:from IS NULL OR s.saleDate >= :from)`). This causes `SQLState: 42P18 — could not determine data type of parameter`.

**Resolution**: The service layer defaults `null` date parameters to a wide historical range (`2000-01-01` to `now()`), and the JPQL uses `BETWEEN :from AND :to` with always-non-null values. Any service accepting optional date parameters should follow this pattern.

### Zustand Hydration on Page Refresh

Zustand `persist` reads from `localStorage` asynchronously on the client. During server-side or initial client render, `token` is `null`. Guards that immediately redirect on `token === null` will log out the user on every refresh.

**Resolution**: All auth-guarded layouts use a `mounted` state that is only set to `true` after the first `useEffect`, ensuring redirect logic only fires after localStorage hydration.

### BigDecimal → JSON → Number

Spring's Jackson serialiser outputs `BigDecimal` as a JSON string (e.g., `"2000.00"`) to preserve precision. The frontend must wrap these values with `Number(value)` before arithmetic. `fmt()` in `lib/utils.ts` handles currency formatting.

### Single-Tenant Login Lookup

`AuthService.login()` looks up users by username across all tenants. In the MVP there is only one tenant, so this is fine. For a true multi-tenant product with public registration, the login form should include a tenant slug field, and the query should add `AND tenant.slug = :slug`.

### DataSeeder Password

The admin password is set via the `ADMIN_INITIAL_PASSWORD` environment variable, read by `DataSeeder.java` on first startup. It is never hardcoded in source. Set it in your `.env` file locally and in Render environment variables for production. The seeder only runs once — after the first tenant is created it is skipped entirely.
