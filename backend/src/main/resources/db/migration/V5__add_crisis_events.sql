CREATE TABLE crisis_events (
    id           BIGSERIAL PRIMARY KEY,
    tenant_id    BIGINT NOT NULL REFERENCES tenants(id),
    event_date   DATE NOT NULL,
    title        VARCHAR(200) NOT NULL,
    severity     VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    affected_count INT,
    affected_species VARCHAR(100),
    solution     TEXT,
    description  TEXT,
    resolved     BOOLEAN NOT NULL DEFAULT FALSE,
    recorded_by  VARCHAR(100),
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_crisis_events_tenant ON crisis_events(tenant_id);
CREATE INDEX idx_crisis_events_date   ON crisis_events(tenant_id, event_date);
