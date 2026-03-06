import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import KanbanBoardWrapper from './KanbanBoardWrapper'
import LeadModal from './LeadModal'

export default async function CRMPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
    const params = await searchParams
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/admin/login')

    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    let query = supabase.from('clients').select('*')

    if (userData?.role === 'sales') {
        query = query.eq('assigned_to', user.id)
    } else if (userData?.role === 'operations') {
        query = query.in('status', ['active', 'onboarding'])
    }

    const { data: clients, error } = await query

    if (error) {
        console.error("Error fetching clients:", JSON.stringify(error, null, 2))
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center p-8 bg-red-900/20 border border-red-500/40 rounded-2xl max-w-md">
                    <div className="text-red-400 text-4xl mb-3">⚠</div>
                    <h3 className="text-red-400 font-bold text-lg mb-2">CRM data not available</h3>
                    <p className="text-red-300/70 text-sm">Database migrations may not have been applied yet.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-[var(--brand-neon)] animate-pulse shadow-[0_0_8px_rgba(0,123,255,0.8)]" />
                        <span className="text-[10px] font-bold text-[var(--brand-neon)] uppercase tracking-[0.2em]">Gestión Comercial</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                        Pipeline de <span className="text-[var(--brand-neon)]">Oportunidades</span>
                    </h1>
                    <p className="text-[var(--text-muted)] mt-1 text-sm font-medium">
                        Monitorea y gestiona tus prospectos comerciales en tiempo real.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden lg:flex items-center gap-6 px-6 py-3 bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl mr-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Total Negocios</span>
                            <span className="text-lg font-bold text-[var(--brand-neon)]">{clients?.length ?? 0}</span>
                        </div>
                        <div className="w-px h-8 bg-[var(--border-glass)]" />
                        <div className="flex flex-col">
                            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Sin Asignar</span>
                            <span className="text-lg font-bold text-white">{clients?.filter(c => !c.assigned_to).length ?? 0}</span>
                        </div>
                    </div>

                    <a
                        href="?new=true"
                        className="btn-premium flex items-center gap-2 no-underline shadow-[0_0_20px_rgba(0,123,255,0.1)]"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Nuevo Lead</span>
                    </a>
                </div>
            </div>

            {/* Pipeline Board */}
            <div className="flex-1 min-h-0 bg-black/20 rounded-3xl border border-[var(--border-glass)] p-4 overflow-hidden">
                <KanbanBoardWrapper initialClients={clients || []} />
            </div>

            {params?.new === 'true' && <LeadModal />}
        </div>
    )
}
