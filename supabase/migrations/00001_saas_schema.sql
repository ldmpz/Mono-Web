-- 00001_saas_schema.sql
-- Core SaaS Architecture for Mono Dashboard

-- 1. Create Custom Types (Enums)
CREATE TYPE public.user_role AS ENUM ('admin', 'sales', 'operations');
CREATE TYPE public.client_status AS ENUM ('lead', 'contacted', 'proposal_sent', 'waiting_response', 'closed_won', 'closed_lost', 'onboarding', 'active');
CREATE TYPE public.billing_type AS ENUM ('one_time', 'monthly');
CREATE TYPE public.service_status AS ENUM ('active', 'paused', 'cancelled');
CREATE TYPE public.invoice_status AS ENUM ('pending', 'paid', 'overdue');

-- 2. Create Tables

-- USERS (Extends auth.users with custom roles)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.user_role NOT NULL DEFAULT 'sales',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CLIENTS (CRM Data)
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    source TEXT,
    status public.client_status NOT NULL DEFAULT 'lead',
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- SERVICES (Agency Offerings)
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    base_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    billing_type public.billing_type NOT NULL DEFAULT 'monthly',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CLIENT_SERVICES (Active Subscriptions / Contracts)
CREATE TABLE public.client_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    billing_type public.billing_type NOT NULL,
    monthly_billing_day INTEGER CHECK (monthly_billing_day >= 1 AND monthly_billing_day <= 31),
    contract_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    renewal_date DATE,
    status public.service_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- INVOICES (Billing and Payments)
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status public.invoice_status NOT NULL DEFAULT 'pending',
    payment_date DATE,
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Indexes for Performance (Scaling)
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_assigned_to ON public.clients(assigned_to);
CREATE INDEX idx_client_services_client_id ON public.client_services(client_id);
CREATE INDEX idx_client_services_status ON public.client_services(status);
CREATE INDEX idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);

-- 4. Triggers (Updated_at)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_client_update
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_client_services_update
    BEFORE UPDATE ON public.client_services
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_invoices_update
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Automate initial user creation in public.users when signup occurs in Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, role)
  VALUES (NEW.id, 'sales'); -- Defaults new users to sales (adjust as needed)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Automate Client Status: Closed Won -> Onboarding
CREATE OR REPLACE FUNCTION public.handle_client_status_automation()
RETURNS TRIGGER AS $$
BEGIN
    -- If status changes to closed_won, we might want to automatically queue onboarding
    -- For this simple implementation, if it's strictly set to closed_won and they have an active service, it implies onboarding
    -- We can intercept status updates:
    IF NEW.status = 'closed_won' AND OLD.status != 'closed_won' THEN
        -- We can either leave it as closed_won or immediately set to onboarding
        -- Let's set it to onboarding to reflect reality
        NEW.status := 'onboarding';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_status_workflow
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    WHEN (NEW.status IS DISTINCT FROM OLD.status)
    EXECUTE PROCEDURE public.handle_client_status_automation();


-- 5. Row Level Security (RLS)

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;


-- Helper Functions for Security Policies
CREATE OR REPLACE FUNCTION public.get_user_role(auth_id UUID)
RETURNS public.user_role AS $$
  SELECT role FROM public.users WHERE id = auth_id;
$$ LANGUAGE sql SECURITY DEFINER;


-- POLICIES: PUBLIC.USERS
-- Admins can do anything
CREATE POLICY "Admins have full access to users" ON public.users FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');
-- Users can see their own profile
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT TO authenticated USING (id = auth.uid());


-- POLICIES: PUBLIC.CLIENTS
-- Admins: All
CREATE POLICY "Admins have full access to clients" ON public.clients FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');
-- Sales: Only assigned clients
CREATE POLICY "Sales can view their clients" ON public.clients FOR SELECT TO authenticated USING (public.get_user_role(auth.uid()) = 'sales' AND assigned_to = auth.uid());
CREATE POLICY "Sales can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) = 'sales' AND assigned_to = auth.uid());
CREATE POLICY "Sales can update their clients" ON public.clients FOR UPDATE TO authenticated USING (public.get_user_role(auth.uid()) = 'sales' AND assigned_to = auth.uid());
-- Operations: Only active/onboarding clients
CREATE POLICY "Operations can view active/onboarding clients" ON public.clients FOR SELECT TO authenticated USING (public.get_user_role(auth.uid()) = 'operations' AND status IN ('active', 'onboarding'));


-- POLICIES: PUBLIC.SERVICES
-- Admins: All
CREATE POLICY "Admins have full access to services" ON public.services FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');
-- Sales, Ops: Read only
CREATE POLICY "Sales and Ops can view services" ON public.services FOR SELECT TO authenticated USING (public.get_user_role(auth.uid()) IN ('sales', 'operations'));


-- POLICIES: PUBLIC.CLIENT_SERVICES
-- Admins: All
CREATE POLICY "Admins have full access to client services" ON public.client_services FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');
-- Sales: Only for their assigned clients
CREATE POLICY "Sales can view services for their clients" ON public.client_services FOR SELECT TO authenticated 
USING (
    public.get_user_role(auth.uid()) = 'sales' AND 
    EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND assigned_to = auth.uid())
);
CREATE POLICY "Sales can insert services for their clients" ON public.client_services FOR INSERT TO authenticated 
WITH CHECK (
    public.get_user_role(auth.uid()) = 'sales' AND 
    EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND assigned_to = auth.uid())
);
-- Ops: Read and Update for active services
CREATE POLICY "Operations can view all client services" ON public.client_services FOR SELECT TO authenticated USING (public.get_user_role(auth.uid()) = 'operations');
CREATE POLICY "Operations can update client services" ON public.client_services FOR UPDATE TO authenticated USING (public.get_user_role(auth.uid()) = 'operations');


-- POLICIES: PUBLIC.INVOICES
-- Admins: All
CREATE POLICY "Admins have full access to invoices" ON public.invoices FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');
-- Sales: View invoices for their clients
CREATE POLICY "Sales can view invoices for their clients" ON public.invoices FOR SELECT TO authenticated 
USING (
    public.get_user_role(auth.uid()) = 'sales' AND 
    EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND assigned_to = auth.uid())
);
-- Ops: Full access (often ops handle billing)
CREATE POLICY "Operations have full access to invoices" ON public.invoices FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'operations');

-- End of schema
