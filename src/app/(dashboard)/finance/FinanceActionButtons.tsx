'use client'

import { useState } from 'react'
import CreateInvoiceModal from './CreateInvoiceModal'

export default function FinanceActionButtons() {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <div>
            <button
                onClick={() => setIsModalOpen(true)}
                className="btn-premium px-6 py-2.5 flex items-center gap-2 group text-sm"
            >
                <svg className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-semibold tracking-wide">Nueva Factura</span>
            </button>

            {isModalOpen && (
                <CreateInvoiceModal onClose={() => setIsModalOpen(false)} />
            )}
        </div>
    )
}
