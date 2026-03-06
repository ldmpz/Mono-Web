import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InvoicesTable from './InvoicesTable'
import FinanceActionButtons from './FinanceActionButtons'

export default async function FinancePage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
            id,
            client_id,
            invoice_number,
            amount,
            description,
            due_date,
            status,
            payment_date,
            payment_method,
            pdf_url,
            clients ( company_name )
        `)
        .order('due_date', { ascending: false })

    if (error) {
        console.error("Error fetching invoices:", JSON.stringify(error, null, 2))
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center p-8 bg-red-900/20 border border-red-500/40 rounded-2xl max-w-lg">
                    <div className="text-red-400 text-4xl mb-3">⚠</div>
                    <h3 className="text-red-400 font-bold text-lg mb-2">Datos financieros no disponibles</h3>
                    <p className="text-red-300/70 text-sm mb-4">
                        Ejecuta las migraciones SQL de Supabase primero. Solo los roles de <strong>administrador</strong> tienen acceso a este módulo.
                    </p>
                    <pre className="text-xs text-red-300/50 font-mono bg-black/40 rounded-lg p-3 text-left overflow-auto max-h-32">
                        {JSON.stringify(error, null, 2)}
                    </pre>
                </div>
            </div>
        )
    }

    // Calculate quick stats
    const totalRevenue = invoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0) ?? 0
    const pendingAmount = invoices?.filter(i => i.status === 'pending').reduce((sum, i) => sum + Number(i.amount), 0) ?? 0
    const overdueCount = invoices?.filter(i => i.status === 'overdue').length ?? 0

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                        Centro de <span className="text-[var(--brand-neon)]">Finanzas</span>
                    </h1>
                    <p className="text-[var(--text-muted)] mt-2 text-sm">
                        Facturación, cobros recurrentes y recaudación de ingresos.
                    </p>
                </div>
                <FinanceActionButtons />
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-panel rounded-2xl p-5 flex flex-col gap-1 hover:-translate-y-1 transition-transform duration-300 border-l-2 border-l-[var(--brand-neon)]/50">
                    <span className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-semibold">Ingresos Cobrados</span>
                    <span className="text-2xl font-mono text-[var(--brand-neon)]">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="glass-panel rounded-2xl p-5 flex flex-col gap-1 hover:-translate-y-1 transition-transform duration-300 border-l-2 border-l-yellow-500/50">
                    <span className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-semibold">Monto Pendiente</span>
                    <span className="text-2xl font-mono text-yellow-400">${pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="glass-panel rounded-2xl p-5 flex flex-col gap-1 hover:-translate-y-1 transition-transform duration-300 border-l-2 border-l-red-500/50">
                    <span className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-semibold">Facturas Vencidas</span>
                    <span className="text-2xl font-mono text-red-400">{overdueCount}</span>
                </div>
            </div>

            {/* Invoices table */}
            <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border-glass)] flex items-center justify-between">
                    <h2 className="font-bold text-[var(--text-primary)] tracking-wide">Todas las Facturas</h2>
                    <span className="text-xs text-[var(--text-muted)] font-mono">{invoices?.length ?? 0} registros</span>
                </div>
                <InvoicesTable initialInvoices={invoices || []} />
            </div>
        </div>
    )
}
