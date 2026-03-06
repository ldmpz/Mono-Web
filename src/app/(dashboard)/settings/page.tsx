'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Bell, Shield, Palette, Globe, Save, CheckCircle, Loader2, Users } from 'lucide-react'
import { createBrowserSupabaseClient } from "@/lib/supabase-client"
import TeamClient from './TeamClient'
import { getTeamUsers } from '@/lib/actions/team'

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
}
const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) {
    return (
        <motion.div variants={item} className="glass-panel rounded-2xl p-6 border border-[var(--border-glass)]">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[var(--border-glass)]">
                <div className="w-8 h-8 rounded-lg bg-[var(--brand-neon)]/10 flex items-center justify-center">
                    <Icon size={16} className="text-[var(--brand-neon)]" />
                </div>
                <h2 className="font-bold text-[var(--text-primary)] tracking-wide">{title}</h2>
            </div>
            {children}
        </motion.div>
    )
}

function Field({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-[var(--border-glass)] last:border-0 last:pb-0">
            <label className="text-sm text-[var(--text-muted)] font-medium min-w-[160px]">{label}</label>
            <div className="flex-1 max-w-sm">{children}</div>
        </div>
    )
}

function Input({ value, onChange, placeholder, type = "text" }: { value?: string, onChange?: (val: string) => void, placeholder?: string, type?: string }) {
    return (
        <input
            type={type}
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-white/20 focus:outline-none focus:border-[var(--brand-neon)] focus:shadow-[0_0_0_2px_rgba(0,123,255,0.08)] transition-all duration-200"
        />
    )
}

function Toggle({ defaultChecked = false, label }: { defaultChecked?: boolean, label: string }) {
    const [on, setOn] = useState(defaultChecked)
    return (
        <div className="flex items-center justify-between py-3 border-b border-[var(--border-glass)] last:border-0">
            <span className="text-sm text-[var(--text-muted)] font-medium">{label}</span>
            <button
                onClick={() => setOn(!on)}
                className={`relative w-11 h-6 rounded-full transition-all duration-300 ${on ? 'bg-[var(--brand-neon)]' : 'bg-[var(--bg-surface)]'}`}
            >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${on ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
        </div>
    )
}

export default function SettingsPage() {
    const [saved, setSaved] = useState(false)
    const [loading, setLoading] = useState(true)
    const [userData, setUserData] = useState<{ id: string, email: string, role: string, fullName: string }>({ id: '', email: '', role: 'Cargando...', fullName: '' })
    const [password, setPassword] = useState("")
    const [allUsers, setAllUsers] = useState<any[]>([])

    const supabase = createBrowserSupabaseClient()

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                // Fetch public.users metadata
                const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
                setUserData({
                    id: user.id,
                    email: user.email || '',
                    role: profile?.role || 'admin',
                    fullName: user.user_metadata?.full_name || 'Usuario'
                })

                if (profile?.role === 'admin') {
                    try {
                        const teamUsers = await getTeamUsers()
                        setAllUsers(teamUsers)
                    } catch (err) {
                        console.error(err)
                        setAllUsers([])
                    }
                }
            }
            setLoading(false)
        }
        fetchUserData()
    }, [supabase])

    const handleSave = async () => {
        setSaved(true)
        if (password) {
            await supabase.auth.updateUser({ password })
            setPassword("")
        }
        await supabase.auth.updateUser({ data: { full_name: userData.fullName } })
        setTimeout(() => setSaved(false), 2500)
    }

    if (loading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-[var(--brand-neon)]" size={32} /></div>
    }

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-3xl">

            {/* Header */}
            <motion.div variants={item} className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                        Confi<span className="text-[var(--brand-neon)]">guración</span>
                    </h1>
                    <p className="text-[var(--text-muted)] mt-1 text-sm">Administra tu cuenta, notificaciones y preferencias del sistema.</p>
                </div>
                <motion.button
                    onClick={handleSave}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${saved
                        ? 'bg-[var(--brand-neon)]/20 text-[var(--brand-neon)] border border-[var(--brand-neon)]/40'
                        : 'btn-premium'
                        }`}
                >
                    {saved ? <CheckCircle size={16} /> : <Save size={16} />}
                    {saved ? 'Guardado' : 'Guardar Cambios'}
                </motion.button>
            </motion.div>

            {/* Perfil */}
            <Section icon={User} title="Perfil de Usuario">
                <Field label="Nombre completo">
                    <Input value={userData.fullName} onChange={(val) => setUserData({ ...userData, fullName: val })} />
                </Field>
                <Field label="Email">
                    <Input value={userData.email} onChange={(val) => setUserData({ ...userData, email: val })} />
                </Field>
                <Field label="Rol">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--brand-neon)]/10 border border-[var(--brand-neon)]/30 rounded-lg text-xs font-bold text-[var(--brand-neon)] uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-neon)] animate-pulse" />
                        {userData.role}
                    </span>
                </Field>
                <Field label="Contraseña">
                    <Input type="password" value={password} onChange={setPassword} placeholder="Ingresa nueva contraseña para cambiarla" />
                </Field>
            </Section>

            {/* Equipo (Solo Admin) */}
            {userData.role === 'admin' && (
                <Section icon={Users} title="Gestión de Equipo">
                    <p className="text-[var(--text-muted)] text-sm mb-6">
                        Crea nuevas cuentas de empleado, asigna roles de base de datos (Admin, Ventas, Operaciones)
                        y administra el acceso de tu organización de forma estructurada.
                    </p>
                    <TeamClient initialUsers={allUsers} currentUserId={userData.id} />
                </Section>
            )}

            {/* Notificaciones */}
            <Section icon={Bell} title="Notificaciones">
                <Toggle defaultChecked label="Alertas de facturas vencidas" />
                <Toggle defaultChecked label="Nuevos leads en el pipeline" />
                <Toggle label="Resumen semanal de métricas" />
                <Toggle defaultChecked label="Alertas de seguridad y accesos" />
            </Section>

            {/* Apariencia */}
            <Section icon={Palette} title="Apariencia">
                <Field label="Tema">
                    <select className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-lg px-3 py-2 text-sm text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-neon)] transition-all duration-200">
                        <option value="dark">Oscuro (Obsidian)</option>
                        <option value="light" disabled>Claro (Próximamente)</option>
                    </select>
                </Field>
                <Field label="Idioma del sistema">
                    <select className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-lg px-3 py-2 text-sm text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-neon)] transition-all duration-200">
                        <option value="es">Español</option>
                        <option value="en">English</option>
                    </select>
                </Field>
            </Section>

            {/* Seguridad */}
            <Section icon={Shield} title="Seguridad">
                <Toggle label="Autenticación de dos factores (2FA)" />
                <Toggle defaultChecked label="Sesiones concurrentes limitadas" />
                <Field label="Tiempo de sesión">
                    <select defaultValue="8 horas" className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-lg px-3 py-2 text-sm text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-neon)] transition-all duration-200">
                        <option value="1 hora">1 hora</option>
                        <option value="4 horas">4 horas</option>
                        <option value="8 horas">8 horas</option>
                        <option value="24 horas">24 horas</option>
                    </select>
                </Field>
            </Section>

            {/* Sistema */}
            <Section icon={Globe} title="Sistema">
                <Field label="URL de Supabase">
                    <Input value="jysjqfvqlmtlqrkmgamn.supabase.co" />
                </Field>
                <Field label="Zona horaria">
                    <select className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-lg px-3 py-2 text-sm text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-neon)] transition-all duration-200">
                        <option>America/Mexico_City (UTC-6)</option>
                        <option>America/New_York (UTC-5)</option>
                        <option>Europe/Madrid (UTC+1)</option>
                    </select>
                </Field>
                <Field label="Versión del sistema">
                    <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-obsidian)] px-3 py-2 rounded-lg border border-[var(--border-glass)]">v1.0.0 — Next.js 15 + Supabase</span>
                </Field>
            </Section>

        </motion.div>
    )
}
