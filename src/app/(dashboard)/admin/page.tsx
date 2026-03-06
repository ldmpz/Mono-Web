"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PricingEditor from "./PricingEditor";
import ServicesEditor from "./ServicesEditor";
import { LayoutDashboard, Blocks } from "lucide-react";

export default function AdminContentPage() {
    const [activeTab, setActiveTab] = useState<'pricing' | 'services'>('pricing');

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                Contenido <span className="text-[var(--brand-neon)]">del Sitio</span>
            </h1>

            {/* Custom Tabs */}
            <div className="flex bg-[var(--bg-obsidian)] p-1 rounded-xl border border-[var(--border-glass)] w-fit mb-6">
                <button
                    onClick={() => setActiveTab('pricing')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'pricing'
                        ? 'bg-[var(--brand-neon)]/10 text-[var(--brand-neon)] border border-[var(--brand-neon)]/20'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 border border-transparent'
                        }`}
                >
                    <Blocks size={16} />
                    Paquetes de Venta
                </button>
                <button
                    onClick={() => setActiveTab('services')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'services'
                        ? 'bg-[var(--brand-neon)]/10 text-[var(--brand-neon)] border border-[var(--brand-neon)]/20'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 border border-transparent'
                        }`}
                >
                    <LayoutDashboard size={16} />
                    Soluciones IA
                </button>
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
                {activeTab === 'pricing' && (
                    <motion.div
                        key="pricing"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <PricingEditor />
                    </motion.div>
                )}
                {activeTab === 'services' && (
                    <motion.div
                        key="services"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ServicesEditor />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
