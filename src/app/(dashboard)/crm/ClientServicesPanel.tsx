'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    getClientServices,
    addClientService,
    updateClientServiceStatus,
    deleteClientService
} from '@/lib/actions/services'

interface Service {
    id: string
    billing_type: 'monthly' | 'one_time'
    contract_value: number
    start_date: string
    renewal_date?: string | null
    status: 'active' | 'paused' | 'cancelled'
    monthly_billing_day?: number | null
    services?: { id: string; name: string; description: string | null } | null
}

interface Props {
    clientId: string
    clientName: string
    onClose: () => void
}

const statusStyles = {
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    paused: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
}

const statusLabels = { active: 'Activo', paused: 'Pausado', cancelled: 'Cancelado' }

function formatCurrency(n: number) {
    return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

export default function ClientServicesPanel({ clientId, clientName, onClose }: Props) {
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [toast, setToast] = useState<string | null>(null)

    const showToast = (msg: string) => {
        setToast(msg)
        setTimeout(() => setToast(null), 3000)
    }

    const load = async () => {
        setLoading(true)
        try {
            const data = await getClientServices(clientId)
            setServices(data as unknown as Service[])
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [clientId])

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [onClose])

    const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const formData = new FormData(e.currentTarget)
            formData.append('client_id', clientId)
            await addClientService(formData)
            showToast('Servicio agregado correctamente ✓')
            setShowForm(false)
            await load()
        } catch (err) {
            showToast('Error al agregar servicio')
            console.error(err)
        } finally {
            setSubmitting(false)
        }
    }

    const handleStatusChange = async (svcId: string, status: 'active' | 'paused' | 'cancelled') => {
        try {
            await updateClientServiceStatus(svcId, status)
            setServices(prev => prev.map(s => s.id === svcId ? { ...s, status } : s))
            showToast('Estado actualizado ✓')
        } catch (err) {
            console.error(err)
        }
    }

    const handleDelete = async (svcId: string) => {
        if (!confirm('¿Eliminar este servicio?')) return
        try {
            await deleteClientService(svcId)
            setServices(prev => prev.filter(s => s.id !== svcId))
            showToast('Servicio eliminado ✓')
        } catch (err) {
            console.error(err)
        }
    }

    const totalMRR = services
        .filter(s => s.status === 'active' && s.billing_type === 'monthly')
        .reduce((sum, s) => sum + Number(s.contract_value), 0)

    return createPortal(
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Drawer */}
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                className="fixed right-0 top-0 h-full w-full max-w-[480px] z-[100] bg-[#0a1020] border-l border-[var(--border-glass)] shadow-[−40px_0_80px_rgba(0,0,0,0.6)] flex flex-col"
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-[var(--border-glass)] bg-gradient-to-r from-[var(--brand-neon)]/5 to-transparent flex items-start justify-between flex-shrink-0">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-[var(--brand-neon)] shadow-[0_0_8px_rgba(0,102,255,0.8)]" />
                            <span className="text-[10px] font-bold text-[var(--brand-neon)] uppercase tracking-widest">Servicios Contratados</span>
                        </div>
                        <h2 className="text-lg font-bold text-white leading-tight">{clientName}</h2>
                        {totalMRR > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-[var(--text-muted)]">MRR Activo:</span>
                                <span className="font-mono font-bold text-[var(--brand-neon)] text-sm">{formatCurrency(totalMRR)}/mes</span>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors mt-0.5">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

                    {/* Add service button / form */}
                    <AnimatePresence mode="wait">
                        {!showForm ? (
                            <motion.button
                                key="add-btn"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowForm(true)}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[var(--brand-neon)]/30 text-[var(--brand-neon)] text-sm font-semibold hover:border-[var(--brand-neon)]/60 hover:bg-[var(--brand-neon)]/5 transition-all duration-200"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                </svg>
                                Agregar Servicio
                            </motion.button>
                        ) : (
                            <motion.form
                                key="add-form"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                onSubmit={handleAdd}
                                className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl p-5 space-y-4"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-sm font-bold text-white">Nuevo Servicio</h3>
                                    <button type="button" onClick={() => setShowForm(false)} className="text-[var(--text-muted)] hover:text-white text-xs">Cancelar</button>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Nombre del Servicio *</label>
                                    <input
                                        name="service_name"
                                        required
                                        placeholder="Ej: Gestión de Redes Sociales"
                                        className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-lg px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[var(--brand-neon)] transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Descripción</label>
                                    <input
                                        name="description"
                                        placeholder="Descripción breve (opcional)"
                                        className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-lg px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[var(--brand-neon)] transition-colors"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Tipo *</label>
                                        <select
                                            name="billing_type"
                                            required
                                            className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--brand-neon)] transition-colors"
                                        >
                                            <option value="monthly">Mensual (MRR)</option>
                                            <option value="one_time">Pago Único</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Valor ($) *</label>
                                        <input
                                            name="contract_value"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            required
                                            placeholder="0.00"
                                            className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-lg px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[var(--brand-neon)] transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Fecha Inicio</label>
                                        <input
                                            name="start_date"
                                            type="date"
                                            defaultValue={new Date().toISOString().split('T')[0]}
                                            className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--brand-neon)] transition-colors [color-scheme:dark]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Renovación</label>
                                        <input
                                            name="renewal_date"
                                            type="date"
                                            className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--brand-neon)] transition-colors [color-scheme:dark]"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full btn-premium py-2.5 text-sm disabled:opacity-50"
                                >
                                    {submitting ? 'Guardando...' : 'Guardar Servicio →'}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {/* Services List */}
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2].map(i => (
                                <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
                            ))}
                        </div>
                    ) : services.length === 0 ? (
                        <div className="text-center py-14 text-[var(--text-muted)]">
                            <svg className="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            <p className="text-sm font-medium">Sin servicios asignados</p>
                            <p className="text-xs mt-1 opacity-60">Agrega el primer servicio para este cliente</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {services.map((svc) => (
                                <motion.div
                                    key={svc.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl p-4 hover:border-[var(--brand-neon)]/20 transition-all duration-200"
                                >
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="text-sm font-bold text-white truncate">
                                                    {svc.services?.name || 'Servicio sin nombre'}
                                                </h4>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusStyles[svc.status]}`}>
                                                    {statusLabels[svc.status]}
                                                </span>
                                            </div>
                                            {svc.services?.description && (
                                                <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{svc.services.description}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(svc.id)}
                                            className="p-1.5 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Stats row */}
                                    <div className="flex items-center gap-4 text-xs mb-3">
                                        <div>
                                            <span className="text-[var(--text-muted)]">Valor </span>
                                            <span className="font-mono font-bold text-white">{formatCurrency(svc.contract_value)}</span>
                                            {svc.billing_type === 'monthly' && <span className="text-[var(--text-muted)]">/mes</span>}
                                        </div>
                                        <div className="w-px h-3 bg-white/10" />
                                        <div>
                                            <span className="text-[var(--text-muted)]">Tipo: </span>
                                            <span className="text-white font-medium">{svc.billing_type === 'monthly' ? 'Mensual' : 'Único'}</span>
                                        </div>
                                        {svc.start_date && (
                                            <>
                                                <div className="w-px h-3 bg-white/10" />
                                                <div>
                                                    <span className="text-[var(--text-muted)]">Inicio: </span>
                                                    <span className="text-white font-medium">{new Date(svc.start_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Status controls */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mr-1">Estado:</span>
                                        {(['active', 'paused', 'cancelled'] as const).map(s => (
                                            <button
                                                key={s}
                                                onClick={() => handleStatusChange(svc.id, s)}
                                                className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider transition-all duration-150 ${svc.status === s
                                                    ? statusStyles[s]
                                                    : 'border-white/10 text-white/30 hover:border-white/20 hover:text-white/50'
                                                    }`}
                                            >
                                                {statusLabels[s]}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Total summary */}
                    {services.length > 0 && (
                        <div className="mt-4 p-4 bg-[var(--brand-neon)]/5 border border-[var(--brand-neon)]/15 rounded-xl">
                            <div className="flex items-center justify-between text-xs mb-2">
                                <span className="text-[var(--text-muted)] font-semibold uppercase tracking-wider">MRR Mensual</span>
                                <span className="font-mono font-bold text-[var(--brand-neon)]">{formatCurrency(totalMRR)}/mes</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-[var(--text-muted)] font-semibold uppercase tracking-wider">ARR Proyectado</span>
                                <span className="font-mono font-bold text-white">{formatCurrency(totalMRR * 12)}/año</span>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-xl bg-[#0a1628]/95 border border-[var(--brand-neon)]/30 text-white text-sm font-medium shadow-2xl flex items-center gap-2.5 backdrop-blur-lg"
                    >
                        <span className="w-2 h-2 bg-[var(--brand-neon)] rounded-full" />
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </>,
        document.body
    )
}
