'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClientLead, updateClientLead, getAssignableUsers } from '@/lib/actions/crm'
import {
    getClientServices,
    addClientService,
    updateClientServiceStatus,
    deleteClientService
} from '@/lib/actions/services'
import { useRouter } from 'next/navigation'

interface LeadModalProps {
    isEditing?: boolean;
    initialData?: {
        id: string;
        company_name: string;
        contact_name?: string;
        email?: string;
        source?: string;
        assigned_to?: string;
    };
    onClose?: () => void;
}

interface Service {
    id: string;
    billing_type: 'monthly' | 'one_time';
    contract_value: number;
    start_date: string;
    renewal_date?: string | null;
    status: 'active' | 'paused' | 'cancelled';
    services?: { id: string; name: string; description: string | null } | null;
}

const statusStyles = {
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    paused: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
}
const statusLabels = { active: 'Activo', paused: 'Pausado', cancelled: 'Cancelado' }

function fmt(n: number) {
    return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

export default function LeadModal({ isEditing, initialData, onClose }: LeadModalProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'datos' | 'servicios'>('datos')

    // --- Datos tab state ---
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [assignableUsers, setAssignableUsers] = useState<{ id: string, full_name: string }[]>([])

    // --- Servicios tab state ---
    const [services, setServices] = useState<Service[]>([])
    const [loadingServices, setLoadingServices] = useState(false)
    const [showServiceForm, setShowServiceForm] = useState(false)
    const [addingService, setAddingService] = useState(false)
    const [svcToast, setSvcToast] = useState<string | null>(null)

    const closeModal = () => {
        if (onClose) onClose()
        else router.push('/crm')
    }

    useEffect(() => {
        getAssignableUsers().then(setAssignableUsers).catch(console.error)
    }, [])

    // Load services when editing and services tab is active
    useEffect(() => {
        if (isEditing && initialData?.id && activeTab === 'servicios') {
            setLoadingServices(true)
            getClientServices(initialData.id)
                .then(data => setServices(data as unknown as Service[]))
                .catch(console.error)
                .finally(() => setLoadingServices(false))
        }
    }, [isEditing, initialData?.id, activeTab])

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true)
        try {
            if (isEditing && initialData) {
                await updateClientLead(initialData.id, {
                    company_name: formData.get('company_name') as string,
                    contact_name: formData.get('contact_name') as string,
                    email: formData.get('email') as string,
                    source: formData.get('source') as string,
                    assigned_to: formData.get('assigned_to') as string,
                })
            } else {
                await createClientLead(formData)
            }
            setIsSuccess(true)
            setTimeout(closeModal, 900)
        } catch (error) {
            console.error(error)
            alert(`Error al ${isEditing ? 'actualizar' : 'crear'} el lead.`)
            setIsSubmitting(false)
        }
    }

    const showSvcToast = (msg: string) => {
        setSvcToast(msg)
        setTimeout(() => setSvcToast(null), 3000)
    }

    const reloadServices = async () => {
        if (!initialData?.id) return
        const data = await getClientServices(initialData.id)
        setServices(data as unknown as Service[])
    }

    const handleAddService = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!initialData?.id) return
        setAddingService(true)
        try {
            const fd = new FormData(e.currentTarget)
            fd.append('client_id', initialData.id)
            await addClientService(fd)
            showSvcToast('Servicio agregado ✓')
            setShowServiceForm(false)
            await reloadServices()
        } catch (err) {
            console.error(err)
            showSvcToast('Error al agregar servicio')
        } finally {
            setAddingService(false)
        }
    }

    const handleStatusChange = async (svcId: string, status: 'active' | 'paused' | 'cancelled') => {
        await updateClientServiceStatus(svcId, status)
        setServices(prev => prev.map(s => s.id === svcId ? { ...s, status } : s))
        showSvcToast('Estado actualizado ✓')
    }

    const handleDeleteService = async (svcId: string) => {
        if (!confirm('¿Eliminar este servicio?')) return
        await deleteClientService(svcId)
        setServices(prev => prev.filter(s => s.id !== svcId))
        showSvcToast('Servicio eliminado ✓')
    }

    const totalMRR = services
        .filter(s => s.status === 'active' && s.billing_type === 'monthly')
        .reduce((sum, s) => sum + Number(s.contract_value), 0)

    const tabs = isEditing
        ? [{ id: 'datos', label: 'Datos' }, { id: 'servicios', label: `Servicios${services.length > 0 && activeTab !== 'servicios' ? ` (${services.length})` : ''}` }]
        : []

    return (
        <AnimatePresence>
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                onClick={closeModal}
            >
                <motion.div
                    key="modal"
                    initial={{ opacity: 0, scale: 0.92, y: 24 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 24 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="glass-panel w-full max-w-lg rounded-2xl relative border border-[var(--border-glass)] shadow-[0_0_60px_rgba(0,0,0,0.5)] overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Top accent */}
                    <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[var(--brand-neon)]/60 to-transparent" />

                    {/* Header */}
                    <div className="px-8 pt-7 pb-0">
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white hover:rotate-90 transition-all duration-300"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-0.5 tracking-wide">
                            {isEditing ? 'Editar' : 'Nuevo'} <span className="text-[var(--brand-neon)]">Lead</span>
                        </h2>
                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-5">
                            {isEditing ? initialData?.company_name : 'Agregar al pipeline'}
                        </p>

                        {/* Tabs — only in edit mode */}
                        {isEditing && (
                            <div className="flex gap-1 border-b border-[var(--border-glass)]">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as 'datos' | 'servicios')}
                                        className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all duration-200 border-b-2 -mb-[1px] ${activeTab === tab.id
                                            ? 'border-[var(--brand-neon)] text-[var(--brand-neon)]'
                                            : 'border-transparent text-[var(--text-muted)] hover:text-white'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tab content */}
                    <div className="px-8 py-6 max-h-[70vh] overflow-y-auto">
                        <AnimatePresence mode="wait">

                            {/* ── DATOS TAB ── */}
                            {activeTab === 'datos' && (
                                <motion.form
                                    key="datos"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.15 }}
                                    action={handleSubmit}
                                    className="space-y-4"
                                >
                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Empresa / Cuenta</label>
                                        <input
                                            name="company_name"
                                            required
                                            defaultValue={initialData?.company_name}
                                            className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-lg p-3 text-white placeholder-white/20 focus:outline-none focus:border-[var(--brand-neon)] focus:shadow-[0_0_0_2px_rgba(0,123,255,0.1)] transition-all duration-200"
                                            placeholder="Acme Corp"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Nombre de Contacto</label>
                                        <input
                                            name="contact_name"
                                            defaultValue={initialData?.contact_name}
                                            className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-lg p-3 text-white placeholder-white/20 focus:outline-none focus:border-[var(--brand-neon)] focus:shadow-[0_0_0_2px_rgba(0,123,255,0.1)] transition-all duration-200"
                                            placeholder="Juan Pérez"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Email</label>
                                        <input
                                            name="email"
                                            type="email"
                                            defaultValue={initialData?.email}
                                            className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-lg p-3 text-white placeholder-white/20 focus:outline-none focus:border-[var(--brand-neon)] transition-all duration-200"
                                            placeholder="juan@empresa.com"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Fuente</label>
                                            <select
                                                name="source"
                                                defaultValue={initialData?.source || 'Inbound'}
                                                className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-lg p-3 text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-neon)] transition-all duration-200"
                                            >
                                                <option value="Inbound">Inbound</option>
                                                <option value="Outbound">Outbound</option>
                                                <option value="Referral">Referido</option>
                                                <option value="Partner">Socio / Partner</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Asignar A</label>
                                            <select
                                                name="assigned_to"
                                                defaultValue={initialData?.assigned_to || ''}
                                                className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-lg p-3 text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-neon)] transition-all duration-200"
                                            >
                                                <option value="">-- Sin Asignar --</option>
                                                {assignableUsers.map(u => (
                                                    <option key={u.id} value={u.id}>{u.full_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting || isSuccess}
                                        className={`w-full py-3 mt-2 flex items-center justify-center gap-2 group transition-all duration-300 ${isSuccess ? 'bg-[var(--brand-neon)] text-white font-bold rounded-lg shadow-[0_0_20px_rgba(0,123,255,0.4)]' : 'btn-premium'}`}
                                    >
                                        <span>{isSuccess ? '¡Completado!' : isSubmitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear y Asignar al Pipeline')}</span>
                                        {!isSuccess && !isSubmitting && (
                                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        )}
                                        {isSuccess && (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                </motion.form>
                            )}

                            {/* ── SERVICIOS TAB ── */}
                            {activeTab === 'servicios' && (
                                <motion.div
                                    key="servicios"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.15 }}
                                    className="space-y-4"
                                >
                                    {/* MRR summary */}
                                    {totalMRR > 0 && (
                                        <div className="flex items-center justify-between px-4 py-3 bg-[var(--brand-neon)]/5 border border-[var(--brand-neon)]/15 rounded-xl">
                                            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">MRR Activo</span>
                                            <span className="font-mono font-bold text-[var(--brand-neon)]">{fmt(totalMRR)}/mes</span>
                                        </div>
                                    )}

                                    {/* Add button / form */}
                                    <AnimatePresence mode="wait">
                                        {!showServiceForm ? (
                                            <motion.button
                                                key="btn"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                onClick={() => setShowServiceForm(true)}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[var(--brand-neon)]/30 text-[var(--brand-neon)] text-sm font-semibold hover:border-[var(--brand-neon)]/60 hover:bg-[var(--brand-neon)]/5 transition-all duration-200"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                                </svg>
                                                Agregar Servicio
                                            </motion.button>
                                        ) : (
                                            <motion.form
                                                key="form"
                                                initial={{ opacity: 0, y: -8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8 }}
                                                onSubmit={handleAddService}
                                                className="bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-xl p-4 space-y-3"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-bold text-white">Nuevo Servicio</span>
                                                    <button type="button" onClick={() => setShowServiceForm(false)} className="text-xs text-[var(--text-muted)] hover:text-white">Cancelar</button>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Nombre *</label>
                                                    <input name="service_name" required placeholder="Ej: Social Media Management" className="w-full bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[var(--brand-neon)] transition-colors" />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Descripción</label>
                                                    <input name="description" placeholder="Opcional" className="w-full bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[var(--brand-neon)] transition-colors" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Tipo *</label>
                                                        <select name="billing_type" required className="w-full bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[var(--brand-neon)] transition-colors">
                                                            <option value="monthly">Mensual (MRR)</option>
                                                            <option value="one_time">Pago Único</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Valor ($) *</label>
                                                        <input name="contract_value" type="number" min="0" step="0.01" required placeholder="0.00" className="w-full bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[var(--brand-neon)] transition-colors" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Inicio</label>
                                                        <input name="start_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[var(--brand-neon)] transition-colors [color-scheme:dark]" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Renovación</label>
                                                        <input name="renewal_date" type="date" className="w-full bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[var(--brand-neon)] transition-colors [color-scheme:dark]" />
                                                    </div>
                                                </div>
                                                <button type="submit" disabled={addingService} className="w-full btn-premium py-2 text-sm disabled:opacity-50">
                                                    {addingService ? 'Guardando...' : 'Guardar Servicio →'}
                                                </button>
                                            </motion.form>
                                        )}
                                    </AnimatePresence>

                                    {/* Services list */}
                                    {loadingServices ? (
                                        <div className="space-y-2">
                                            {[1, 2].map(i => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)}
                                        </div>
                                    ) : services.length === 0 ? (
                                        <div className="text-center py-8 text-[var(--text-muted)]">
                                            <svg className="w-10 h-10 mx-auto mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            <p className="text-sm">Sin servicios asignados</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {services.map(svc => (
                                                <motion.div
                                                    key={svc.id}
                                                    layout
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-xl p-4"
                                                >
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="text-sm font-bold text-white truncate">{svc.services?.name || 'Servicio'}</span>
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusStyles[svc.status]}`}>
                                                                    {statusLabels[svc.status]}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                                                <span className="font-mono font-bold text-white">{fmt(svc.contract_value)}</span>
                                                                {svc.billing_type === 'monthly' ? '/mes' : ' único'}
                                                                {svc.start_date && ` · Inicio: ${new Date(svc.start_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteService(svc.id)}
                                                            className="p-1.5 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    {/* Status buttons */}
                                                    <div className="flex items-center gap-1.5">
                                                        {(['active', 'paused', 'cancelled'] as const).map(s => (
                                                            <button
                                                                key={s}
                                                                onClick={() => handleStatusChange(svc.id, s)}
                                                                className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider transition-all ${svc.status === s ? statusStyles[s] : 'border-white/10 text-white/25 hover:text-white/50'}`}
                                                            >
                                                                {statusLabels[s]}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            ))}

                                            {/* Footer totals */}
                                            {totalMRR > 0 && (
                                                <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--border-glass)] px-1">
                                                    <span className="text-[var(--text-muted)]">ARR Proyectado</span>
                                                    <span className="font-mono font-bold text-white">{fmt(totalMRR * 12)}/año</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Toast */}
                                    <AnimatePresence>
                                        {svcToast && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-xl bg-[#0a1628]/95 border border-[var(--brand-neon)]/30 text-white text-sm font-medium shadow-2xl flex items-center gap-2.5 backdrop-blur-lg"
                                            >
                                                <span className="w-2 h-2 bg-[var(--brand-neon)] rounded-full" />
                                                {svcToast}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
