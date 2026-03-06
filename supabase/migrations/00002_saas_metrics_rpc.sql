-- 00002_saas_metrics_rpc.sql
-- RPCs for efficient real-time SaaS Metric calculations

-- Create a composite type to return all metrics neatly
CREATE TYPE public.saas_metrics_result AS (
    current_mrr NUMERIC,
    current_arr NUMERIC,
    monthly_revenue NUMERIC,
    total_revenue NUMERIC,
    pending_invoices_count INTEGER,
    new_leads_month INTEGER,
    churn_rate NUMERIC,
    average_ticket NUMERIC,
    ltv NUMERIC,
    cac NUMERIC
);

CREATE OR REPLACE FUNCTION public.get_saas_metrics()
RETURNS public.saas_metrics_result
LANGUAGE plpgsql
SECURITY DEFINER -- Ensures the function runs with elevated privileges to view aggregate data across the app
AS $$
DECLARE
    res public.saas_metrics_result;
    active_customers_start_of_month INT;
    lost_customers_in_month INT;
    total_customers INT;
BEGIN
    -- 1. Current MRR (Monthly Recurring Revenue)
    -- Sum of contract_value for active client_services where billing_type is monthly
    SELECT COALESCE(SUM(contract_value), 0)
    INTO res.current_mrr
    FROM public.client_services
    WHERE status = 'active' AND billing_type = 'monthly';

    -- 2. Current ARR (Annual Recurring Revenue)
    res.current_arr := res.current_mrr * 12;

    -- 3. Monthly Revenue (Actual cash collected this month from invoices)
    SELECT COALESCE(SUM(amount), 0)
    INTO res.monthly_revenue
    FROM public.invoices
    WHERE status = 'paid'
      AND date_trunc('month', payment_date) = date_trunc('month', CURRENT_DATE);

    -- 4. Total Revenue (All time collected)
    SELECT COALESCE(SUM(amount), 0)
    INTO res.total_revenue
    FROM public.invoices
    WHERE status = 'paid';

    -- 5. Pending Invoices Count
    SELECT COUNT(*)
    INTO res.pending_invoices_count
    FROM public.invoices
    WHERE status = 'pending';

    -- 6. New Leads this Month
    SELECT COUNT(*)
    INTO res.new_leads_month
    FROM public.clients
    WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE);

    -- 7. Average Ticket (ARPU - Average Revenue Per User/Active Client)
    -- Total MRR / Number of Active Clients
    SELECT COUNT(DISTINCT client_id)
    INTO total_customers
    FROM public.client_services
    WHERE status = 'active';

    IF total_customers > 0 THEN
        res.average_ticket := ROUND(res.current_mrr / total_customers, 2);
    ELSE
        res.average_ticket := 0;
    END IF;

    -- 8. Churn Rate (Percentage of customers lost this month)
    -- Formula: (Lost Customers in Period / Customers at Start of Period) * 100
    -- Simplified approach for this dashboard: 
    SELECT COUNT(*)
    INTO lost_customers_in_month
    FROM public.clients
    WHERE status = 'closed_lost'
      AND date_trunc('month', updated_at) = date_trunc('month', CURRENT_DATE);
      
    -- Estimating start of month customers: current active + lost this month
    active_customers_start_of_month := total_customers + lost_customers_in_month;

    IF active_customers_start_of_month > 0 THEN
        res.churn_rate := ROUND((lost_customers_in_month::NUMERIC / active_customers_start_of_month::NUMERIC) * 100, 2);
    ELSE
        res.churn_rate := 0;
    END IF;

    -- 9. LTV (Lifetime Value)
    -- Simplified Formula: Average Ticket / Churn Rate (as a decimal)
    -- Note: If churn is 0, LTV calculation needs a ceiling or assumption (e.g. 24 months)
    IF res.churn_rate > 0 THEN
        res.ltv := ROUND(res.average_ticket / (res.churn_rate / 100), 2);
    ELSE
        res.ltv := ROUND(res.average_ticket * 24, 2); -- Assuming 2 year lifespan if 0 churn
    END IF;

    -- 10. CAC (Customer Acquisition Cost)
    -- We assume a simplistic mockup metric for the demo (e.g. static or calculated based on arbitrary logic unless Marketing Spend table exists)
    -- Placeholder: $250.00
    res.cac := 250.00;

    RETURN res;
END;
$$;
