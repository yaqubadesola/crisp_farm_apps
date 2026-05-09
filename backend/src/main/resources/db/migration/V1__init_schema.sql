-- ── Tenants ───────────────────────────────────────────────────────────
CREATE TABLE tenants (
    id                BIGSERIAL PRIMARY KEY,
    name              VARCHAR(100) NOT NULL,
    slug              VARCHAR(50)  NOT NULL UNIQUE,
    subscription_plan VARCHAR(20)  NOT NULL DEFAULT 'FREE',
    active            BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Users ─────────────────────────────────────────────────────────────
CREATE TABLE users (
    id            BIGSERIAL    PRIMARY KEY,
    tenant_id     BIGINT       NOT NULL REFERENCES tenants(id),
    username      VARCHAR(50)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  NOT NULL,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, username)
);

-- ── Customers ─────────────────────────────────────────────────────────
CREATE TABLE customers (
    id            BIGSERIAL   PRIMARY KEY,
    tenant_id     BIGINT      NOT NULL REFERENCES tenants(id),
    name          VARCHAR(100) NOT NULL,
    phone         VARCHAR(20),
    email         VARCHAR(100),
    address       TEXT,
    customer_type VARCHAR(20) NOT NULL DEFAULT 'RETAIL',
    created_at    TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ── Pricing Tiers ─────────────────────────────────────────────────────
CREATE TABLE pricing_tiers (
    id           BIGSERIAL      PRIMARY KEY,
    tenant_id    BIGINT         NOT NULL REFERENCES tenants(id),
    tier_name    VARCHAR(20)    NOT NULL,
    price_per_kg NUMERIC(12, 2) NOT NULL,
    currency     VARCHAR(10)    NOT NULL DEFAULT 'NGN',
    updated_at   TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_by   VARCHAR(50),
    UNIQUE (tenant_id, tier_name)
);

-- ── Ponds ─────────────────────────────────────────────────────────────
CREATE TABLE ponds (
    id          BIGSERIAL      PRIMARY KEY,
    tenant_id   BIGINT         NOT NULL REFERENCES tenants(id),
    name        VARCHAR(100)   NOT NULL,
    capacity_kg NUMERIC(10, 2),
    notes       TEXT,
    active      BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- ── Farm Cycles ───────────────────────────────────────────────────────
CREATE TABLE cycles (
    id                 BIGSERIAL      PRIMARY KEY,
    tenant_id          BIGINT         NOT NULL REFERENCES tenants(id),
    pond_id            BIGINT         REFERENCES ponds(id),
    name               VARCHAR(100)   NOT NULL,
    start_date         DATE           NOT NULL,
    end_date           DATE,
    status             VARCHAR(20)    NOT NULL DEFAULT 'ACTIVE',
    fingerling_count   INT,
    fingerling_source  VARCHAR(100),
    expected_yield_kg  NUMERIC(10, 2),
    actual_yield_kg    NUMERIC(10, 2),
    total_mortalities  INT            NOT NULL DEFAULT 0,
    notes              TEXT,
    created_by         VARCHAR(50),
    created_at         TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- ── Cycle Mortalities ─────────────────────────────────────────────────
CREATE TABLE cycle_mortalities (
    id            BIGSERIAL PRIMARY KEY,
    tenant_id     BIGINT    NOT NULL REFERENCES tenants(id),
    cycle_id      BIGINT    NOT NULL REFERENCES cycles(id),
    count         INT       NOT NULL,
    cause         VARCHAR(200),
    recorded_date DATE      NOT NULL,
    recorded_by   VARCHAR(50),
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Sales ─────────────────────────────────────────────────────────────
CREATE TABLE sales (
    id                BIGSERIAL      PRIMARY KEY,
    tenant_id         BIGINT         NOT NULL REFERENCES tenants(id),
    customer_id       BIGINT         NOT NULL REFERENCES customers(id),
    cycle_id          BIGINT         REFERENCES cycles(id),
    cashier_id        BIGINT         REFERENCES users(id),
    sale_date         DATE           NOT NULL,
    total_quantity_kg NUMERIC(10, 3) NOT NULL,
    total_price       NUMERIC(12, 2) NOT NULL,
    payment_method    VARCHAR(20)    NOT NULL,
    invoice_number    VARCHAR(50)    UNIQUE,
    invoice_status    VARCHAR(20)    NOT NULL DEFAULT 'PAID',
    notes             TEXT,
    created_at        TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- ── Sale Items ────────────────────────────────────────────────────────
CREATE TABLE sale_items (
    id          BIGSERIAL      PRIMARY KEY,
    tenant_id   BIGINT         NOT NULL REFERENCES tenants(id),
    sale_id     BIGINT         NOT NULL REFERENCES sales(id),
    quantity_kg NUMERIC(10, 3) NOT NULL,
    unit_price  NUMERIC(12, 2) NOT NULL,
    subtotal    NUMERIC(12, 2) NOT NULL
);

-- ── Expenses ──────────────────────────────────────────────────────────
CREATE TABLE expenses (
    id           BIGSERIAL      PRIMARY KEY,
    tenant_id    BIGINT         NOT NULL REFERENCES tenants(id),
    cycle_id     BIGINT         REFERENCES cycles(id),
    category     VARCHAR(30)    NOT NULL,
    amount       NUMERIC(12, 2) NOT NULL,
    description  TEXT,
    expense_date DATE           NOT NULL,
    recorded_by  VARCHAR(50),
    created_at   TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- ── Inventory Items ───────────────────────────────────────────────────
CREATE TABLE inventory_items (
    id                BIGSERIAL      PRIMARY KEY,
    tenant_id         BIGINT         NOT NULL REFERENCES tenants(id),
    name              VARCHAR(100)   NOT NULL,
    category          VARCHAR(20)    NOT NULL,
    quantity_in_stock NUMERIC(10, 2) NOT NULL DEFAULT 0,
    unit              VARCHAR(20)    NOT NULL DEFAULT 'kg',
    reorder_level     NUMERIC(10, 2),
    created_at        TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- ── Inventory Transactions ────────────────────────────────────────────
CREATE TABLE inventory_transactions (
    id               BIGSERIAL      PRIMARY KEY,
    tenant_id        BIGINT         NOT NULL REFERENCES tenants(id),
    item_id          BIGINT         NOT NULL REFERENCES inventory_items(id),
    cycle_id         BIGINT         REFERENCES cycles(id),
    transaction_type VARCHAR(20)    NOT NULL,
    quantity         NUMERIC(10, 2) NOT NULL,
    unit_cost        NUMERIC(12, 2),
    total_cost       NUMERIC(12, 2),
    notes            TEXT,
    transaction_date DATE           NOT NULL,
    recorded_by      VARCHAR(50),
    created_at       TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- ── Payments (debt resolution) ────────────────────────────────────────
CREATE TABLE payments (
    id             BIGSERIAL      PRIMARY KEY,
    tenant_id      BIGINT         NOT NULL REFERENCES tenants(id),
    sale_id        BIGINT         NOT NULL REFERENCES sales(id),
    customer_id    BIGINT         NOT NULL REFERENCES customers(id),
    amount         NUMERIC(12, 2) NOT NULL,
    payment_date   DATE           NOT NULL,
    payment_method VARCHAR(20)    NOT NULL,
    notes          TEXT,
    recorded_by    VARCHAR(50),
    created_at     TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- ── Audit Logs ────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
    id          BIGSERIAL   PRIMARY KEY,
    tenant_id   BIGINT      NOT NULL REFERENCES tenants(id),
    user_id     BIGINT,
    username    VARCHAR(50),
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id   BIGINT,
    details     TEXT,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ── Performance Indexes ───────────────────────────────────────────────
CREATE INDEX idx_users_tenant           ON users(tenant_id);
CREATE INDEX idx_customers_tenant       ON customers(tenant_id);
CREATE INDEX idx_cycles_tenant          ON cycles(tenant_id);
CREATE INDEX idx_sales_tenant           ON sales(tenant_id);
CREATE INDEX idx_sales_customer         ON sales(customer_id, tenant_id);
CREATE INDEX idx_sales_date             ON sales(tenant_id, sale_date);
CREATE INDEX idx_expenses_tenant        ON expenses(tenant_id);
CREATE INDEX idx_expenses_date          ON expenses(tenant_id, expense_date);
CREATE INDEX idx_inventory_items_tenant ON inventory_items(tenant_id);
CREATE INDEX idx_payments_tenant        ON payments(tenant_id);
CREATE INDEX idx_payments_sale          ON payments(sale_id);
CREATE INDEX idx_audit_logs_tenant      ON audit_logs(tenant_id);
CREATE INDEX idx_pricing_tiers_tenant   ON pricing_tiers(tenant_id);
