import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MetricsDashboardClient from './MetricsDashboardClient'

export const revalidate = 0

export default async function MetricsDashboardPage() {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) redirect('/admin/login')

    const date = new Date()
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString()

    // 1. MRR
    const { data: activeServices } = await supabase.from('client_services').select('contract_value').eq('status', 'active').eq('billing_type', 'monthly')
    const current_mrr = activeServices?.reduce((sum, s) => sum + (Number(s.contract_value) || 0), 0) || 0
    const current_arr = current_mrr * 12

    // 2. Revenues
    const { data: monthlyInvoices } = await supabase.from('invoices').select('amount').eq('status', 'paid').gte('payment_date', firstDay)
    const monthly_revenue = monthlyInvoices?.reduce((sum, i) => sum + (Number(i.amount) || 0), 0) || 0

    const { data: allInvoices } = await supabase.from('invoices').select('amount').eq('status', 'paid')
    const total_revenue = allInvoices?.reduce((sum, i) => sum + (Number(i.amount) || 0), 0) || 0

    // 3. Pending Invoices
    const { count: pending_invoices_count } = await supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('status', 'pending')

    // 4. New Leads
    const { count: new_leads_month } = await supabase.from('clients').select('id', { count: 'exact', head: true }).gte('created_at', firstDay)

    // 5. Avg Ticket
    const { count: activeClientsCount } = await supabase.from('clients').select('id', { count: 'exact', head: true }).in('status', ['onboarding', 'active'])
    const average_ticket = (activeClientsCount && activeClientsCount > 0) ? current_mrr / activeClientsCount : 0

    // 6. Churn rate (cancelled services / total services)
    const { count: cancelledServices } = await supabase.from('client_services').select('id', { count: 'exact', head: true }).eq('status', 'cancelled')
    const totalServices = (activeServices?.length || 0) + (cancelledServices || 0)
    const churn_rate = totalServices > 0 ? ((cancelledServices || 0) / totalServices) * 100 : 0

    const metrics = {
        current_mrr,
        current_arr,
        monthly_revenue,
        total_revenue,
        pending_invoices_count: pending_invoices_count || 0,
        new_leads_month: new_leads_month || 0,
        average_ticket,
        churn_rate: Number(churn_rate.toFixed(2)),
        ltv: churn_rate > 0 ? average_ticket / (churn_rate / 100) : average_ticket * 12,
        cac: 250 // Mock default or calculated
    }

    return <MetricsDashboardClient metrics={metrics} />
}
