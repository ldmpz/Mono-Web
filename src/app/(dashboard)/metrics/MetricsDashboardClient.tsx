'use client'

import { motion } from 'framer-motion'

interface Metrics {
    current_mrr?: number
    current_arr?: number
    monthly_revenue?: number
    total_revenue?: number
    pending_invoices_count?: number
    new_leads_month?: number
    churn_rate?: number
    average_ticket?: number
    ltv?: number
    cac?: number
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08 }
    }
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
}

function MetricCard({
    title,
    value,
    valueClass = "text-[var(--text-primary)]",
    icon,
    glowColor = "rgba(0,123,255,0.08)"
}: {
    title: string
    value: string | number
    valueClass?: string
    icon?: string
    glowColor?: string
}) {
    return (
        <motion.div
            variants={item}
            whileHover={{ y: -4, scale: 1.02 }}
            className="glass-panel p-5 rounded-xl flex flex-col justify-between border-l-2 border-l-transparent hover:border-l-[var(--brand-neon)] transition-all duration-300 group relative overflow-hidden cursor-default"
            style={{ '--glow': glowColor } as React.CSSProperties}
        >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `radial-gradient(ellipse at 80% 0%, ${glowColor}, transparent 70%)` }}
            />
            {icon && <span className="text-2xl mb-2 relative z-10">{icon}</span>}
            <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider relative z-10">{title}</span>
            <span className={`text-2xl font-mono mt-1 relative z-10 ${valueClass}`}>{value}</span>
        </motion.div>
    )
}

export default function MetricsDashboardClient({ metrics }: { metrics: Metrics | null }) {
    const m = metrics ?? {}

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            {/* Header */}
            <motion.div variants={item}>
                <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                    Panel de <span className="text-[var(--brand-neon)]">Inteligencia</span>
                </h1>
                <p className="text-[var(--text-muted)] mt-2 text-sm">
                    Métricas de rendimiento SaaS y de ingresos de la agencia en tiempo real.
                </p>
            </motion.div>

            {/* MRR & ARR highlight cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                    variants={item}
                    whileHover={{ y: -6 }}
                    className="glass-panel rounded-2xl p-8 relative overflow-hidden group cursor-default"
                >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--brand-neon)] opacity-[0.04] rounded-full blur-3xl group-hover:opacity-[0.08] transition-opacity duration-500" />
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--brand-neon)]/30 to-transparent" />
                    <p className="text-xs uppercase tracking-widest font-semibold text-[var(--text-muted)]">MRR Actual</p>
                    <p className="text-5xl font-mono mt-3 text-[var(--brand-neon)] drop-shadow-[0_0_20px_rgba(0,123,255,0.4)]">
                        ${m.current_mrr?.toLocaleString() ?? '0'}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-2">Ingreso Mensual Recurrente</p>
                </motion.div>

                <motion.div
                    variants={item}
                    whileHover={{ y: -6 }}
                    className="glass-panel rounded-2xl p-8 relative overflow-hidden group cursor-default"
                >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500 opacity-[0.04] rounded-full blur-3xl group-hover:opacity-[0.08] transition-opacity duration-500" />
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
                    <p className="text-xs uppercase tracking-widest font-semibold text-[var(--text-muted)]">ARR Actual</p>
                    <p className="text-5xl font-mono mt-3 text-[var(--text-primary)]">
                        ${m.current_arr?.toLocaleString() ?? '0'}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-2">Ingreso Anual Recurrente</p>
                </motion.div>
            </div>

            {/* Secondary metrics */}
            <motion.div variants={container} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard icon="💰" title="Ingresos del Mes" value={`$${m.monthly_revenue?.toLocaleString() ?? 0}`} />
                <MetricCard icon="📊" title="Ingresos Totales" value={`$${m.total_revenue?.toLocaleString() ?? 0}`} />
                <MetricCard icon="⏳" title="Facturas Pendientes" value={m.pending_invoices_count ?? 0} valueClass="text-yellow-400" />
                <MetricCard icon="🎯" title="Nuevos Leads (Mes)" value={m.new_leads_month ?? 0} valueClass="text-[var(--brand-neon)]" />
            </motion.div>

            {/* Divider */}
            <motion.div variants={item} className="h-px w-full bg-gradient-to-r from-transparent via-[var(--border-glass)] to-transparent" />

            {/* SaaS Health */}
            <motion.div variants={item}>
                <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">Indicadores de Salud SaaS</h3>
                <motion.div variants={container} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        icon="📉"
                        title="Churn Rate"
                        value={`${m.churn_rate ?? 0}%`}
                        valueClass={Number(m.churn_rate) > 5 ? 'text-red-400' : 'text-[var(--brand-neon)]'}
                    />
                    <MetricCard icon="🎟️" title="Avg Ticket" value={`$${m.average_ticket?.toLocaleString() ?? 0}`} />
                    <MetricCard icon="♾️" title="LTV" value={`$${m.ltv?.toLocaleString() ?? 0}`} valueClass="text-[var(--brand-neon)]" />
                    <MetricCard icon="📢" title="CAC" value={`$${m.cac?.toLocaleString() ?? 250}`} />
                </motion.div>
            </motion.div>
        </motion.div>
    )
}
