0-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- FUNCTION: generate_uuid_v7()
CREATE OR REPLACE FUNCTION generate_uuid_v7() RETURNS uuid AS $$
DECLARE
  v_time timestamp with time zone := null;
  v_msec bigint := null;
  v_hex bytea := null;
  v_uuid bytea := null;
BEGIN
  v_time := clock_timestamp();
  v_msec := EXTRACT(EPOCH FROM v_time) * 1000;
  v_hex := decode(lpad(to_hex(v_msec), 12, '0'), 'hex');
  v_uuid := gen_random_uuid()::text::bytea;
  v_uuid := set_byte(v_uuid, 0, get_byte(v_hex, 2));
  v_uuid := set_byte(v_uuid, 1, get_byte(v_hex, 3));
  v_uuid := set_byte(v_uuid, 2, get_byte(v_hex, 4));
  v_uuid := set_byte(v_uuid, 3, get_byte(v_hex, 5));
  v_uuid := set_byte(v_uuid, 4, get_byte(v_uuid, 4) & 15 | 112);
  v_uuid := set_byte(v_uuid, 8, get_byte(v_uuid, 8) & 63 | 128);
  RETURN encode(v_uuid, 'hex')::uuid;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Auto Update trigger helper
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TABLE: tenants (Organization workspace)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT generate_uuid_v7(),
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE,
    stripe_customer_id TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- ROLES & PERMISSIONS ENUMS
CREATE TYPE platform_role AS ENUM ('superadmin', 'admin', 'sales', 'operations', 'finance');

-- TABLE: users (Extended from auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE RESTRICT NOT NULL,
    role platform_role NOT NULL DEFAULT 'operations',
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: clients
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT generate_uuid_v7(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    company_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    mrr_usd NUMERIC(12,2) DEFAULT 0 CHECK (mrr_usd >= 0),
    status TEXT DEFAULT 'lead' CHECK (status IN ('lead', 'active', 'churned', 'paused')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- TABLE: kanban_columns
CREATE TABLE kanban_columns (
    id UUID PRIMARY KEY DEFAULT generate_uuid_v7(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    position INT NOT NULL,
    color TEXT DEFAULT '#1F6BFF',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: tasks (Cards in the CRM)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT generate_uuid_v7(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    column_id UUID REFERENCES kanban_columns(id) ON DELETE RESTRICT NOT NULL,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    tags TEXT[] DEFAULT '{}',
    position DECIMAL(10,5) NOT NULL, -- fractional indexing for drag-and-drop
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- TABLE: invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT generate_uuid_v7(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    client_id UUID REFERENCES clients(id) NOT NULL,
    stripe_invoice_id TEXT UNIQUE,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void')),
    due_date TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    auto_advance BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: audit_logs (Partitioned natively by date, great for SOC2 scale)
CREATE TABLE audit_logs (
    id UUID DEFAULT generate_uuid_v7(),
    tenant_id UUID NOT NULL,
    actor_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Initial Audit Partition for 2026/2027
CREATE TABLE audit_logs_2026 PARTITION OF audit_logs FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

------------------------------------------------------------------------------------------------------------------------
-- UPDATED_AT TRIGGERS
------------------------------------------------------------------------------------------------------------------------
CREATE TRIGGER update_tenants_modtime BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_clients_modtime BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();

------------------------------------------------------------------------------------------------------------------------
-- INDEXES - ENTERPRISE QUERY TUNING
------------------------------------------------------------------------------------------------------------------------
CREATE INDEX idx_clients_tenant_status ON clients (tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_kanban ON tasks (tenant_id, column_id, position) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_client ON tasks (client_id);
CREATE INDEX idx_clients_metadata ON clients USING GIN (metadata);
CREATE INDEX idx_invoices_status ON invoices (tenant_id, status);

------------------------------------------------------------------------------------------------------------------------
-- ROW-LEVEL SECURITY (RLS) ZERO TRUST IMPLEMENTATION
------------------------------------------------------------------------------------------------------------------------

-- Helpers to read JWT properly
CREATE OR REPLACE FUNCTION auth.tenant_id() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.tenant_id', true), '')::UUID;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.role', true), '');
$$ LANGUAGE SQL STABLE;

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- 1. TENANTS RLS
CREATE POLICY "Tenants isolation" ON tenants FOR SELECT
USING (id = auth.tenant_id());

-- 2. USERS RLS
CREATE POLICY "Users tenant isolation" ON users FOR SELECT
USING (tenant_id = auth.tenant_id());

CREATE POLICY "Admin update users" ON users FOR UPDATE
USING (tenant_id = auth.tenant_id() AND auth.role() IN ('admin', 'superadmin'));

-- 3. CLIENTS RLS
CREATE POLICY "Clients SELECT" ON clients FOR SELECT
USING (tenant_id = auth.tenant_id() AND deleted_at IS NULL);

CREATE POLICY "Clients INSERT Admin/Sales/Ops" ON clients FOR INSERT
WITH CHECK (tenant_id = auth.tenant_id() AND auth.role() IN ('admin', 'sales', 'superadmin'));

CREATE POLICY "Clients UPDATE" ON clients FOR UPDATE
USING (tenant_id = auth.tenant_id() AND deleted_at IS NULL)
WITH CHECK (tenant_id = auth.tenant_id() AND auth.role() IN ('admin', 'sales', 'operations', 'superadmin'));

CREATE POLICY "Clients NO HARD DELETE" ON clients FOR DELETE USING (false);

-- 4. KANBAN RLS
CREATE POLICY "Kanban cols SELECT" ON kanban_columns FOR SELECT
USING (tenant_id = auth.tenant_id());

CREATE POLICY "Kanban tasks SELECT" ON tasks FOR SELECT
USING (tenant_id = auth.tenant_id() AND deleted_at IS NULL);

CREATE POLICY "Kanban tasks UPDATE" ON tasks FOR UPDATE
USING (tenant_id = auth.tenant_id() AND deleted_at IS NULL);

CREATE POLICY "Kanban tasks INSERT" ON tasks FOR INSERT
WITH CHECK (tenant_id = auth.tenant_id());

-- 4. INVOICES RLS
CREATE POLICY "Invoices SELECT" ON invoices FOR SELECT
USING (tenant_id = auth.tenant_id());

------------------------------------------------------------------------------------------------------------------------
-- MATERIALIZED VIEW FOR SAAS METRICS
------------------------------------------------------------------------------------------------------------------------
CREATE MATERIALIZED VIEW mv_tenant_metrics AS
SELECT 
    t.id as tenant_id,
    DATE_TRUNC('month', c.created_at) as cohort_month,
    COUNT(c.id) FILTER (WHERE c.status = 'active') as active_clients,
    COALESCE(SUM(c.mrr_usd) FILTER (WHERE c.status = 'active'), 0) as current_mrr,
    COALESCE(SUM(c.mrr_usd) FILTER (WHERE c.status = 'active'), 0) * 12 as current_arr,
    COUNT(c.id) FILTER (WHERE c.status = 'churned') as churned_clients,
    CASE WHEN COUNT(c.id) FILTER (WHERE c.status = 'active') > 0 
         THEN COALESCE(SUM(c.mrr_usd) FILTER (WHERE c.status = 'active'), 0) / COUNT(c.id) FILTER (WHERE c.status = 'active')
         ELSE 0 
    END as arpu
FROM tenants t
LEFT JOIN clients c ON c.tenant_id = t.id
WHERE c.deleted_at IS NULL
GROUP BY t.id, DATE_TRUNC('month', c.created_at);

CREATE UNIQUE INDEX idx_mv_tenant_metrics on mv_tenant_metrics(tenant_id, cohort_month);
