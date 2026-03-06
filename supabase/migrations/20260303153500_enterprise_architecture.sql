-- ==========================================
-- 1. EXTENSIONS & CUSTOM FUNCTIONS (UUID v7)
-- ==========================================
-- Supabase no soporta UUIDv7 nativo out-of-the-box en PostgreSQL 15 sin pg_idkit o PL/pgSQL aún,
-- usaremos una función rápida en plpgsql basada en el timestamp de red para ser index-friendly y orderable.
CREATE OR REPLACE FUNCTION uuid_generate_v7() 
RETURNS uuid AS $$
DECLARE
  v_time timestamp with time zone := clock_timestamp();
  v_unix_t bigint := extract(epoch from v_time) * 1000;
  v_bytes bytea;
BEGIN
  v_bytes := set_byte(decode(lpad(to_hex(v_unix_t), 12, '0'), 'hex'), 6, (random() * 255)::integer);
  -- version 7
  v_bytes := set_byte(v_bytes, 6, (get_byte(v_bytes, 6) & 15) | (7 << 4));
  -- variant 10
  v_bytes := set_byte(v_bytes, 8, (get_byte(v_bytes, 8) & 63) | 128);
  FOR i IN 7..15 LOOP
    IF i != 6 AND i != 8 THEN
      v_bytes := set_byte(v_bytes, i, (random() * 255)::integer);
    END IF;
  END LOOP;
  RETURN encode(v_bytes, 'hex')::uuid;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ==========================================
-- 2. CORE TABLES (MULTI-TENANT READY)
-- ==========================================

-- Tenants
CREATE TABLE public.tenants (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
    name text NOT NULL,
    domain text UNIQUE,
    stripe_customer_id text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    deleted_at timestamptz -- Soft Delete
);

-- Users & Sub-roles dentro del Tenant (RBAC)
CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'finance', 'operations', 'sales');

CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
    role user_role NOT NULL DEFAULT 'operations',
    email text NOT NULL UNIQUE,
    full_name text NOT NULL,
    avatar_url text,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    deleted_at timestamptz
);

-- Auditoría Inmutable
CREATE TABLE public.audit_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    action text NOT NULL, -- Ej: 'UPDATE_INVOICE'
    table_name text NOT NULL,
    record_id uuid NOT NULL,
    old_data jsonb,
    new_data jsonb,
    ip_address text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Clients
CREATE TABLE public.clients (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name text NOT NULL,
    tax_id text,
    industry text,
    status text DEFAULT 'active',
    created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    deleted_at timestamptz
);

-- Invoices (Sistema de Billing SaaS)
CREATE TYPE invoice_status AS ENUM ('draft', 'open', 'paid', 'void', 'uncollectible');

CREATE TABLE public.invoices (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    stripe_invoice_id text UNIQUE,
    amount_due numeric(15, 2) NOT NULL,
    amount_paid numeric(15, 2) DEFAULT 0,
    currency text DEFAULT 'USD',
    status invoice_status DEFAULT 'draft',
    due_date date NOT NULL,
    billing_reason text, -- 'subscription_cycle', 'manual'
    created_by uuid REFERENCES public.users(id),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- CRM Kanban Enterprise
CREATE TABLE public.kanban_columns (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name text NOT NULL,
    position integer NOT NULL,
    color_hex text,
    board_type text DEFAULT 'crm', 
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.tasks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
    column_id uuid NOT NULL REFERENCES public.kanban_columns(id) ON DELETE RESTRICT,
    title text NOT NULL,
    description text,
    assignee_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    position double precision NOT NULL, 
    priority integer DEFAULT 3,
    value_mrr numeric(15,2) DEFAULT 0, 
    created_by uuid REFERENCES public.users(id),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    deleted_at timestamptz
);

-- Snapshot Table para métricas históricas (MRR, ARR, Churn)
CREATE TABLE public.metrics_snapshots (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    month date NOT NULL,
    active_customers integer NOT NULL DEFAULT 0,
    mrr numeric(15,2) NOT NULL DEFAULT 0,
    arr numeric(15,2) GENERATED ALWAYS AS (mrr * 12) STORED,
    churned_revenue numeric(15,2) NOT NULL DEFAULT 0,
    expansion_revenue numeric(15,2) NOT NULL DEFAULT 0,
    cac numeric(15,2), 
    recorded_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(tenant_id, month)
);

-- ==========================================
-- 3. INDEXADO AVANZADO Y PERFORMANCE
-- ==========================================
CREATE INDEX idx_clients_active ON public.clients (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_kanban ON public.tasks (tenant_id, board_type, column_id, position) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_status_date ON public.invoices (tenant_id, status, due_date);
CREATE INDEX idx_audit_logs_record ON public.audit_logs (table_name, record_id);

-- Vista Materializada ultra-rápida
CREATE MATERIALIZED VIEW mv_tenant_kpis AS 
SELECT 
    tenant_id,
    COUNT(id) FILTER (WHERE status = 'active') as total_active_clients,
    (SELECT mrr FROM public.metrics_snapshots ms WHERE ms.tenant_id = c.tenant_id ORDER BY month DESC LIMIT 1) as current_mrr
FROM public.clients c
WHERE deleted_at IS NULL
GROUP BY tenant_id;

-- ==========================================
-- 4. SEGURIDAD ENTERPRISE (RLS HARDENING)
-- ==========================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION auth.jwt_tenant_id() RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
$$;

CREATE OR REPLACE FUNCTION auth.jwt_user_role() RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT auth.jwt() -> 'app_metadata' ->> 'role';
$$;

-- Tenants
CREATE POLICY "Tenants isolated read" ON public.tenants
FOR SELECT USING (id = auth.jwt_tenant_id());

-- Users
CREATE POLICY "Users read same tenant" ON public.users
FOR SELECT USING (tenant_id = auth.jwt_tenant_id());
CREATE POLICY "Users update own profile" ON public.users
FOR UPDATE USING (id = auth.uid());

-- Clients
CREATE POLICY "Tenants isolated read clients" ON public.clients 
FOR SELECT USING (tenant_id = auth.jwt_tenant_id() AND deleted_at IS NULL);
CREATE POLICY "Admins y Sales pueden mutar clients" ON public.clients 
FOR ALL USING (
    tenant_id = auth.jwt_tenant_id() AND 
    auth.jwt_user_role() IN ('superadmin', 'admin', 'sales')
);

-- Invoices
CREATE POLICY "Finance/Admin CRUD invoices" ON public.invoices 
FOR ALL USING (
    tenant_id = auth.jwt_tenant_id() AND 
    auth.jwt_user_role() IN ('superadmin', 'admin', 'finance')
);
CREATE POLICY "Sales can READ invoices" ON public.invoices 
FOR SELECT USING (
    tenant_id = auth.jwt_tenant_id() AND 
    auth.jwt_user_role() = 'sales'
);

-- Kanban & Tasks
CREATE POLICY "Users within tenant can view boards" ON public.kanban_columns
FOR SELECT USING (tenant_id = auth.jwt_tenant_id());

CREATE POLICY "Users within tenant can view tasks" ON public.tasks
FOR SELECT USING (tenant_id = auth.jwt_tenant_id() AND deleted_at IS NULL);

CREATE POLICY "Users within tenant can create tasks" ON public.tasks
FOR INSERT WITH CHECK (tenant_id = auth.jwt_tenant_id());

CREATE POLICY "Users within tenant can update tasks" ON public.tasks
FOR UPDATE USING (tenant_id = auth.jwt_tenant_id());

-- Audit Logs
CREATE POLICY "Audit logs solo admins view" ON public.audit_logs
FOR SELECT USING (
    tenant_id = auth.jwt_tenant_id() AND 
    auth.jwt_user_role() IN ('superadmin', 'admin')
);

-- ==========================================
-- 5. TRIGGERS AUTOMÁTICOS
-- ==========================================

CREATE OR REPLACE FUNCTION public.record_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (tenant_id, user_id, action, table_name, record_id, old_data, new_data)
    VALUES (
        COALESCE(NEW.tenant_id, OLD.tenant_id),
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::jsonb ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_audit_clients AFTER INSERT OR UPDATE OR DELETE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.record_audit_log();
CREATE TRIGGER trigger_audit_invoices AFTER INSERT OR UPDATE OR DELETE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.record_audit_log();
CREATE TRIGGER trigger_audit_tasks AFTER UPDATE OR DELETE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.record_audit_log();
