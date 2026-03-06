'use client'

import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import {
    LayoutGrid,
    DollarSign,
    BarChart3,
    Settings,
    Zap,
    Shield,
    LogOut
} from 'lucide-react'

const navItems = [
    { href: '/crm', label: 'Pipeline CRM', icon: LayoutGrid },
    { href: '/finance', label: 'Facturación', icon: DollarSign },
    { href: '/metrics', label: 'Métricas', icon: BarChart3 },
    { href: '/admin', label: 'Contenido Web', icon: Shield },
    { href: '/settings', label: 'Configuración', icon: Settings },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createBrowserSupabaseClient()
    const [allowedModules, setAllowedModules] = useState<string[]>(['crm', 'finance', 'metrics', 'settings', 'admin'])

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                supabase.from('users').select('modules').eq('id', user.id).single().then(({ data }) => {
                    if (data?.modules) setAllowedModules(data.modules)
                })
            }
        })
    }, [supabase])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/admin/login')
    }

    const filteredNav = navItems.filter(item => {
        const key = item.href.replace('/', '')
        return allowedModules.includes(key) || allowedModules.includes(item.href)
    })

    return (
        <div className="flex min-h-screen bg-[var(--bg-obsidian)] text-[var(--text-primary)] font-sans">

            {/* Sidebar */}
            <motion.aside
                initial={{ x: -80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-64 flex flex-col border-r border-[var(--border-glass)] bg-[var(--bg-surface)] backdrop-blur-xl relative"
            >
                {/* Sidebar glow */}
                <div className="absolute bottom-0 left-0 w-full h-48 bg-[var(--brand-neon)] opacity-[0.03] blur-[60px] rounded-full pointer-events-none" />

                {/* Logo */}
                <div className="p-6 border-b border-[var(--border-glass)] h-16 flex items-center gap-2">
                    <Zap size={20} className="text-[var(--brand-neon)]" />
                    <h2 className="text-xl font-bold tracking-widest text-[var(--text-primary)]">
                        M O N O
                    </h2>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-4 flex flex-col gap-1 relative z-10">
                    {filteredNav.map((item, i) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                        const Icon = item.icon
                        return (
                            <motion.div
                                key={item.href}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 + i * 0.07, duration: 0.4, ease: 'easeOut' }}
                            >
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 p-3 rounded-xl font-medium text-sm transition-all duration-300 group relative overflow-hidden ${isActive
                                        ? 'bg-[var(--brand-neon)]/10 text-[var(--brand-neon)] border border-[var(--border-highlight)] shadow-[0_0_20px_rgba(0,123,255,0.08)]'
                                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                                        }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-active"
                                            className="absolute inset-0 bg-[var(--brand-neon)]/5 rounded-xl"
                                        />
                                    )}
                                    <Icon
                                        size={17}
                                        className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-[var(--brand-neon)]' : ''}`}
                                    />
                                    <span className="relative z-10">{item.label}</span>
                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--brand-neon)] shadow-[0_0_6px_rgba(0,123,255,0.8)]" />
                                    )}
                                </Link>
                            </motion.div>
                        )
                    })}
                </nav>

                {/* Bottom section (Badge + Logout) */}
                <div className="p-4 border-t border-[var(--border-glass)] flex flex-col gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--brand-neon)]/5 border border-[var(--border-highlight)]/40 pointer-events-none">
                        <div className="w-2 h-2 rounded-full bg-[var(--brand-neon)] animate-pulse shadow-[0_0_8px_rgba(0,123,255,0.8)]" />
                        <span className="text-xs font-semibold text-[var(--brand-neon)] tracking-widest uppercase">En Vivo</span>
                    </div>

                    <button
                        onClick={handleSignOut}
                        className="flex items-center justify-center gap-2 w-full p-2 rounded-lg bg-[var(--bg-obsidian)] border border-[var(--border-glass)] text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-300"
                    >
                        <LogOut size={16} />
                        <span className="text-sm font-semibold tracking-wide">Cerrar Sesión</span>
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden relative">
                {/* Ambient glow top-right */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--brand-neon)] opacity-[0.03] rounded-full blur-[120px] pointer-events-none" />
                {/* Ambient glow bottom-left */}
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 opacity-[0.02] rounded-full blur-[100px] pointer-events-none" />

                <motion.div
                    key={pathname}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="p-8"
                >
                    {children}
                </motion.div>
            </main>
        </div>
    )
}
