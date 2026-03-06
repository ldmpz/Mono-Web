'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createInvoice, getInvoiceClients, updateInvoice } from '@/lib/actions/finance'

interface InvoiceModalProps {
    onClose: () => void;
    isEditing?: boolean;
    initialData?: {
        id: string;
        client_id?: string;
        amount: number;
        description?: string;
        due_date: string;
        status: string;
    };
}

export default function CreateInvoiceModal({ onClose, isEditing, initialData }: InvoiceModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [clients, setClients] = useState<{ id: string, company_name: string }[]>([])

    useEffect(() => {
        getInvoiceClients().then(setClients).catch(console.error)
    }, [])

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true)
        try {
            if (isEditing && initialData) {
                await updateInvoice(initialData.id, formData)
            } else {
                await createInvoice(formData)
            }
            setIsSuccess(true)
            setTimeout(() => {
                onClose()
            }, 1000)
        } catch (error) {
            console.error(error)
            alert(`Error al ${isEditing ? 'actualizar' : 'crear'} la factura. Asegúrate de haber ejecutado la migración SQL para agregar la columna "description".`)
            setIsSubmitting(false)
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="bg-[var(--bg-card)] border border-[var(--border-glass)] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <div className="p-6 border-b border-[var(--border-glass)] bg-gradient-to-r from-white/5 to-transparent">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="p-1.5 bg-[var(--brand-neon)]/10 text-[var(--brand-neon)] flex items-center justify-center rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            </span>
                            {isEditing ? 'Editar Factura' : 'Nueva Factura'}
                        </h2>
                        <p className="text-sm text-[var(--text-muted)] mt-1">
                            {isEditing ? 'Actualiza los detalles del cobro.' : 'Crea un nuevo cobro asociado a un cliente del CRM.'}
                        </p>
                    </div>

                    <form action={handleSubmit} className="p-6 space-y-5">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">
                                    Cliente
                                </label>
                                {isEditing ? (
                                    // Read-only in edit mode — client cannot be changed
                                    <div className="w-full bg-[var(--bg-obsidian)]/60 border border-[var(--border-glass)] rounded-lg p-3 flex items-center gap-2.5 cursor-not-allowed opacity-70">
                                        <svg className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        <span className="text-[var(--text-primary)] text-sm">
                                            {clients.find(c => c.id === initialData?.client_id)?.company_name || 'Cliente'}
                                        </span>
                                        <input type="hidden" name="client_id" value={initialData?.client_id || ''} />
                                    </div>
                                ) : (
                                    <select
                                        name="client_id"
                                        required
                                        defaultValue={initialData?.client_id || ''}
                                        className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-lg p-3 text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-neon)] transition-all duration-200"
                                    >
                                        <option value="">-- Seleccionar Cliente --</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.company_name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Monto ($)</label>
                                <input
                                    name="amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    defaultValue={initialData?.amount}
                                    className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-lg p-3 text-white placeholder-white/20 focus:outline-none focus:border-[var(--brand-neon)] focus:shadow-[0_0_0_2px_rgba(0,123,255,0.1)] transition-all duration-200"
                                    placeholder="2500.00"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Descripción</label>
                                <input
                                    name="description"
                                    required
                                    defaultValue={initialData?.description}
                                    className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-lg p-3 text-white placeholder-white/20 focus:outline-none focus:border-[var(--brand-neon)] focus:shadow-[0_0_0_2px_rgba(0,123,255,0.1)] transition-all duration-200"
                                    placeholder="Implementación de CRM"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Fecha Límite</label>
                                    <input
                                        name="due_date"
                                        type="date"
                                        required
                                        defaultValue={initialData?.due_date}
                                        className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-lg p-3 text-white placeholder-white/20 focus:outline-none focus:border-[var(--brand-neon)] transition-all duration-200 [color-scheme:dark]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Estado</label>
                                    <select
                                        name="status"
                                        required
                                        defaultValue={initialData?.status || "pending"}
                                        className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-lg p-3 text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-neon)] transition-all duration-200"
                                    >
                                        <option value="pending">Pendiente</option>
                                        <option value="paid">Pagado</option>
                                        <option value="overdue">Vencido</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || isSuccess || clients.length === 0}
                            className={`w-full py-3 mt-4 flex items-center justify-center gap-2 group transition-all duration-300 ${isSuccess ? 'bg-[var(--brand-neon)] text-white font-bold rounded-lg shadow-[0_0_20px_rgba(0,123,255,0.4)]' : 'btn-premium'}`}
                        >
                            <span>{isSuccess ? '¡Completado!' : isSubmitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Factura')}</span>
                            {!isSuccess && !isSubmitting && (
                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            )}
                            {isSuccess && (
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
