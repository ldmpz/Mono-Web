ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sales can view their clients" ON public.clients;
DROP POLICY IF EXISTS "Sales can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Sales can update their clients" ON public.clients;
DROP POLICY IF EXISTS "Operations can view active/onboarding clients" ON public.clients;

DROP POLICY IF EXISTS "Sales can view services for their clients" ON public.client_services;
DROP POLICY IF EXISTS "Sales can insert services for their clients" ON public.client_services;
DROP POLICY IF EXISTS "Operations can view all client services" ON public.client_services;
DROP POLICY IF EXISTS "Operations can update client services" ON public.client_services;

DROP POLICY IF EXISTS "Sales can view invoices for their clients" ON public.invoices;
DROP POLICY IF EXISTS "Operations have full access to invoices" ON public.invoices;
DROP POLICY IF EXISTS "Sales Ops can view services" ON public.services;

-- Clients
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
CREATE POLICY "Authenticated users can view clients" ON public.clients FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients;
CREATE POLICY "Authenticated users can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
CREATE POLICY "Authenticated users can update clients" ON public.clients FOR UPDATE TO authenticated USING (true);

-- Client Services
DROP POLICY IF EXISTS "Authenticated users can view client_services" ON public.client_services;
CREATE POLICY "Authenticated users can view client_services" ON public.client_services FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert client_services" ON public.client_services;
CREATE POLICY "Authenticated users can insert client_services" ON public.client_services FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update client_services" ON public.client_services;
CREATE POLICY "Authenticated users can update client_services" ON public.client_services FOR UPDATE TO authenticated USING (true);

-- Invoices
DROP POLICY IF EXISTS "Authenticated users can view invoices" ON public.invoices;
CREATE POLICY "Authenticated users can view invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert invoices" ON public.invoices;
CREATE POLICY "Authenticated users can insert invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update invoices" ON public.invoices;
CREATE POLICY "Authenticated users can update invoices" ON public.invoices FOR UPDATE TO authenticated USING (true);

-- Services
DROP POLICY IF EXISTS "Authenticated users can view services" ON public.services;
CREATE POLICY "Authenticated users can view services" ON public.services FOR SELECT TO authenticated USING (true);
