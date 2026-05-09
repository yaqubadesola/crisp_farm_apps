CREATE TABLE customer_types (
    id         BIGSERIAL PRIMARY KEY,
    tenant_id  BIGINT       NOT NULL,
    type_name  VARCHAR(50)  NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_customer_types UNIQUE (tenant_id, type_name)
);

-- Widen column so new dynamic types (up to 50 chars) can be stored
ALTER TABLE customers ALTER COLUMN customer_type TYPE VARCHAR(50);
