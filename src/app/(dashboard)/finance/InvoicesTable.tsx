'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { markInvoicePaid, deleteInvoice } from '@/lib/actions/finance'
import { motion, AnimatePresence } from 'framer-motion'
import CreateInvoiceModal from './CreateInvoiceModal'

interface Invoice {
    id: string;
    amount: number;
    due_date: string;
    status: string;
    description?: string;
    payment_date?: string;
    payment_method?: string;
    clients?: { company_name: string } | { company_name: string }[];
    client_id?: string;
    invoice_number?: string;
    pdf_url?: string;
}

interface DropdownPosition {
    top: number;
    right: number;
}

// Dropdown rendered via portal to escape table overflow constraints
function DropdownPortal({
    invoiceId,
    inv,
    position,
    onClose,
    onMarkPaid,
    onEdit,
    onDelete,
    loadingId,
}: {
    invoiceId: string;
    inv: Invoice;
    position: DropdownPosition;
    onClose: () => void;
    onMarkPaid: (id: string) => void;
    onEdit: (inv: Invoice) => void;
    onDelete: (id: string) => void;
    loadingId: string | null;
}) {
    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (!target.closest(`[data-dropdown="${invoiceId}"]`)) {
                onClose()
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [invoiceId, onClose])

    return createPortal(
        <motion.div
            data-dropdown={invoiceId}
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.12 }}
            style={{
                position: 'fixed',
                top: position.top,
                right: window.innerWidth - position.right,
                zIndex: 9999,
            }}
            className="w-48 bg-[#0e1628] border border-[var(--border-glass)] rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] py-1.5 overflow-hidden"
        >
            {inv.status !== 'paid' && (
                <button
                    onClick={() => { onMarkPaid(inv.id); onClose() }}
                    disabled={loadingId === inv.id}
                    className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--brand-neon)]/10 hover:text-[var(--brand-neon)] transition-colors flex items-center gap-2.5 disabled:opacity-50"
                >
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    Marcar Pagado
                </button>
            )}
            <button
                onClick={() => { onEdit(inv); onClose() }}
                className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-white/5 transition-colors flex items-center gap-2.5"
            >
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
            </button>
            <div className="mx-3 my-1 border-t border-white/10" />
            <button
                onClick={() => { onDelete(inv.id); onClose() }}
                disabled={loadingId === inv.id}
                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2.5 disabled:opacity-50"
            >
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Eliminar
            </button>
        </motion.div>,
        document.body
    )
}

export default function InvoicesTable({ initialInvoices }: { initialInvoices: Invoice[] }) {
    const [invoices, setInvoices] = useState(initialInvoices)
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [downloadingId, setDownloadingId] = useState<string | null>(null)
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
    const [dropdownPos, setDropdownPos] = useState<DropdownPosition>({ top: 0, right: 0 })
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
    const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({})

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3500)
    }

    const handleOpenDropdown = (id: string) => {
        if (openDropdownId === id) {
            setOpenDropdownId(null)
            return
        }
        const btn = btnRefs.current[id]
        if (btn) {
            const rect = btn.getBoundingClientRect()
            setDropdownPos({ top: rect.bottom + 6, right: rect.right })
        }
        setOpenDropdownId(id)
    }

    const handleMarkPaid = async (id: string) => {
        setLoadingId(id)
        try {
            await markInvoicePaid(id, 'manual_transfer')
            setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: 'paid', payment_date: new Date().toISOString().split('T')[0] } : inv))
            showToast('Factura marcada como pagada ✓')
        } catch (err) {
            console.error(err)
            showToast('Error al marcar como pagada', 'error')
        } finally {
            setLoadingId(null)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta factura? Esta acción no se puede deshacer.')) return
        setLoadingId(id)
        try {
            await deleteInvoice(id)
            setInvoices(invoices.filter(inv => inv.id !== id))
            showToast('Factura eliminada ✓')
        } catch (err) {
            console.error(err)
            showToast('Error al eliminar la factura', 'error')
        } finally {
            setLoadingId(null)
        }
    }

    const handleDownloadPDF = async (inv: Invoice) => {
        setDownloadingId(inv.id)
        try {
            showToast('Generando PDF...')
            const response = await fetch(`/api/invoice-pdf?id=${inv.id}`)
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}))
                throw new Error(errData.details || errData.error || 'Error al generar el PDF')
            }
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${inv.invoice_number || 'factura'}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            showToast(`PDF descargado: ${inv.invoice_number || 'factura'} ✓`)
        } catch (err) {
            console.error(err)
            showToast(err instanceof Error ? err.message : 'Error al generar el PDF', 'error')
        } finally {
            setDownloadingId(null)
        }
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            case 'pending': return 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            case 'overdue': return 'bg-red-500/15 text-red-400 border border-red-500/30 font-bold'
            default: return 'bg-gray-800/60 text-gray-400 border border-gray-700'
        }
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = { paid: 'Pagado', pending: 'Pendiente', overdue: 'Vencido' }
        return labels[status] || status
    }

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.06 } }
    }
    const item = {
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 30 } }
    }

    return (
        <>
            {/* Toast */}
            <AnimatePresence>
                {toast && typeof document !== 'undefined' && createPortal(
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.96 }}
                        className={`fixed bottom-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-medium backdrop-blur-lg ${toast.type === 'success'
                            ? 'bg-[#0a1628]/95 border-[var(--brand-neon)]/30 text-white'
                            : 'bg-red-950/95 border-red-500/30 text-red-200'
                            }`}
                    >
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${toast.type === 'success' ? 'bg-[var(--brand-neon)]' : 'bg-red-500'}`} />
                        {toast.message}
                    </motion.div>,
                    document.body
                )}
            </AnimatePresence>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-[var(--border-glass)] bg-[var(--bg-obsidian)] shadow-2xl">
                <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase bg-[var(--bg-surface)] text-[var(--text-muted)] border-b border-[var(--border-glass)]">
                        <tr>
                            <th className="px-5 py-4 font-semibold tracking-widest"># Factura</th>
                            <th className="px-5 py-4 font-semibold tracking-widest">Cliente</th>
                            <th className="px-5 py-4 font-semibold tracking-widest">Descripción</th>
                            <th className="px-5 py-4 font-semibold tracking-widest">Monto</th>
                            <th className="px-5 py-4 font-semibold tracking-widest">Estado</th>
                            <th className="px-5 py-4 font-semibold tracking-widest">Vence</th>
                            <th className="px-5 py-4 font-semibold tracking-widest text-right">Acciones</th>
                        </tr>
                    </thead>
                    <motion.tbody variants={container} initial="hidden" animate="show" className="divide-y divide-[var(--border-glass)]/50">
                        {invoices.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center gap-3 text-[var(--text-muted)]">
                                        <svg className="w-10 h-10 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-sm italic">Sin facturas registradas</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            invoices.map((inv) => (
                                <motion.tr key={inv.id} variants={item} className="group hover:bg-white/[0.02] transition-colors duration-200">

                                    {/* # Factura */}
                                    <td className="px-5 py-4">
                                        <span className="font-mono text-[11px] font-bold text-[var(--brand-neon)] bg-[var(--brand-neon)]/10 border border-[var(--brand-neon)]/20 px-2.5 py-1 rounded-md tracking-wider">
                                            {inv.invoice_number || '—'}
                                        </span>
                                    </td>

                                    {/* Cliente */}
                                    <td className="px-5 py-4 font-medium text-[var(--text-primary)] max-w-[180px]">
                                        <span className="truncate block">
                                            {Array.isArray(inv.clients)
                                                ? (inv.clients[0]?.company_name || '—')
                                                : (inv.clients?.company_name || '—')}
                                        </span>
                                    </td>

                                    {/* Descripción */}
                                    <td className="px-5 py-4 max-w-[160px]">
                                        <span className="text-[var(--text-muted)] text-xs truncate block" title={inv.description || ''}>
                                            {inv.description || 'Sin descripción'}
                                        </span>
                                    </td>

                                    {/* Monto */}
                                    <td className="px-5 py-4">
                                        <span className="font-mono font-bold text-[var(--text-primary)] text-sm">
                                            ${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>

                                    {/* Estado */}
                                    <td className="px-5 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] tracking-wider uppercase font-bold ${getStatusStyle(inv.status)}`}>
                                            {getStatusLabel(inv.status)}
                                        </span>
                                    </td>

                                    {/* Fecha */}
                                    <td className="px-5 py-4 font-mono text-xs text-[var(--text-muted)]">
                                        {new Date(inv.due_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>

                                    {/* Acciones */}
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {/* PDF Button */}
                                            <button
                                                onClick={() => handleDownloadPDF(inv)}
                                                disabled={downloadingId === inv.id}
                                                title="Descargar PDF"
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg bg-[var(--brand-neon)]/10 border border-[var(--brand-neon)]/25 text-[var(--brand-neon)] hover:bg-[var(--brand-neon)]/20 hover:border-[var(--brand-neon)]/50 hover:shadow-[0_0_14px_rgba(0,102,255,0.25)] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider"
                                            >
                                                {downloadingId === inv.id ? (
                                                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                )}
                                                PDF
                                            </button>

                                            {/* Three-dot Menu Trigger */}
                                            <button
                                                ref={el => { btnRefs.current[inv.id] = el }}
                                                onClick={() => handleOpenDropdown(inv.id)}
                                                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-white/8 transition-all duration-150"
                                            >
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <circle cx="10" cy="4" r="1.5" />
                                                    <circle cx="10" cy="10" r="1.5" />
                                                    <circle cx="10" cy="16" r="1.5" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))
                        )}
                    </motion.tbody>
                </table>
            </div>

            {/* Dropdown Portal */}
            <AnimatePresence>
                {openDropdownId && (() => {
                    const inv = invoices.find(i => i.id === openDropdownId)
                    if (!inv) return null
                    return (
                        <DropdownPortal
                            key={openDropdownId}
                            invoiceId={openDropdownId}
                            inv={inv}
                            position={dropdownPos}
                            onClose={() => setOpenDropdownId(null)}
                            onMarkPaid={handleMarkPaid}
                            onEdit={(i) => setEditingInvoice(i)}
                            onDelete={handleDelete}
                            loadingId={loadingId}
                        />
                    )
                })()}
            </AnimatePresence>

            {/* Edit Modal Portal */}
            {editingInvoice && typeof document !== 'undefined' && createPortal(
                <CreateInvoiceModal
                    onClose={() => setEditingInvoice(null)}
                    isEditing={true}
                    initialData={{
                        id: editingInvoice.id,
                        client_id: editingInvoice.client_id,
                        amount: editingInvoice.amount,
                        due_date: editingInvoice.due_date,
                        status: editingInvoice.status,
                        description: editingInvoice.description
                    }}
                />,
                document.body
            )}
        </>
    )
}
