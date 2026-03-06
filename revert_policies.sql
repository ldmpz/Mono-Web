DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can view client_services" ON public.client_services;
DROP POLICY IF EXISTS "Authenticated users can insert client_services" ON public.client_services;
DROP POLICY IF EXISTS "Authenticated users can update client_services" ON public.client_services;
DROP POLICY IF EXISTS "Authenticated users can view invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can view services" ON public.services;

CREATE POLICY "Sales can view their clients" ON public.clients FOR SELECT TO authenticated USING (public.get_user_role(auth.uid()) = 'sales' AND assigned_to = auth.uid());
CREATE POLICY "Sales can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) = 'sales' AND assigned_to = auth.uid());
CREATE POLICY "Sales can update their clients" ON public.clients FOR UPDATE TO authenticated USING (public.get_user_role(auth.uid()) = 'sales' AND assigned_to = auth.uid());
CREATE POLICY "Operations can view active/onboarding clients" ON public.clients FOR SELECT TO authenticated USING (public.get_user_role(auth.uid()) = 'operations' AND status IN ('active', 'onboarding'));

CREATE POLICY "Sales and Ops can view services" ON public.services FOR SELECT TO authenticated USING (public.get_user_role(auth.uid()) IN ('sales', 'operations'));

CREATE POLICY "Sales can view services for their clients" ON public.client_services FOR SELECT TO authenticated USING (public.get_user_role(auth.uid()) = 'sales' AND EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND assigned_to = auth.uid()));
CREATE POLICY "Sales can insert services for their clients" ON public.client_services FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) = 'sales' AND EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND assigned_to = auth.uid()));
CREATE POLICY "Operations can view all client services" ON public.client_services FOR SELECT TO authenticated USING (public.get_user_role(auth.uid()) = 'operations');
CREATE POLICY "Operations can update client services" ON public.client_services FOR UPDATE TO authenticated USING (public.get_user_role(auth.uid()) = 'operations');

CREATE POLICY "Sales can view invoices for their clients" ON public.invoices FOR SELECT TO authenticated USING (public.get_user_role(auth.uid()) = 'sales' AND EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND assigned_to = auth.uid()));
CREATE POLICY "Operations have full access to invoices" ON public.invoices FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'operations');
