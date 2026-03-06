'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Mail, Shield, User, X, CheckCircle, AlertCircle, Edit2 } from 'lucide-react'
import { createUserTeam, deleteUserTeam, updateUserTeam } from '@/lib/actions/team'

interface TeamUser {
    id: string
    full_name: string
    email: string
    role: string
    modules?: string[]
    is_active: boolean
    created_at: string
}

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}
const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
}

export default function TeamClient({ initialUsers, currentUserId }: { initialUsers: TeamUser[], currentUserId: string }) {
    const [users, setUsers] = useState(initialUsers)
    const [isAdding, setIsAdding] = useState(false)
    const [loading, setLoading] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [errorMsg, setErrorMsg] = useState("")
    const [mounted, setMounted] = useState(false)
    const [editingUser, setEditingUser] = useState<TeamUser | null>(null)

    useEffect(() => setMounted(true), [])
    useEffect(() => setUsers(initialUsers), [initialUsers])

    const [formData, setFormData] = useState<{ fullName: string; email: string; password?: string; role: string; modules: string[] }>({
        fullName: "",
        email: "",
        password: "",
        role: "sales",
        modules: ["crm"]
    })

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErrorMsg("")

        try {
            if (editingUser) {
                await updateUserTeam(editingUser.id, formData)
            } else {
                await createUserTeam(formData)
            }
            window.location.reload()
        } catch (error: any) {
            setErrorMsg(error.message || "Error al guardar usuario.")
            setLoading(false)
        }
    }

    const openEditModal = (u: TeamUser) => {
        setEditingUser(u)
        setFormData({
            fullName: u.full_name,
            email: u.email,
            password: "",
            role: u.role,
            modules: u.modules || []
        })
        setIsAdding(true)
    }

    const openAddModal = () => {
        setEditingUser(null)
        setFormData({ fullName: "", email: "", password: "", role: "sales", modules: ["crm"] })
        setIsAdding(true)
    }

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("¿Eliminar este miembro del equipo definitivamente? No podrá acceder más al panel.")) return
        setDeletingId(userId)
        try {
            await deleteUserTeam(userId)
            setUsers(users.filter(u => u.id !== userId))
        } catch (error: any) {
            alert("Hubo un error al eliminar: " + error.message)
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="space-y-6 relative">

            <div className="flex justify-end mb-4">
                <button
                    onClick={openAddModal}
                    className="btn-premium flex items-center gap-2"
                >
                    <Plus size={16} /> Agregar Miembro
                </button>
            </div>

            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {users.map((u) => (
                    <motion.div key={u.id} variants={item} className="glass-panel p-5 rounded-2xl border border-[var(--border-glass)] hover:border-[var(--brand-neon)]/50 transition-all duration-300 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${u.role === 'admin' ? 'bg-[var(--brand-neon)]/10 text-[var(--brand-neon)] border-[var(--brand-neon)]/30' :
                                u.role === 'sales' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                                    'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                }`}>
                                {u.role === 'sales' ? 'ventas' : u.role === 'operations' ? 'operaciones' : u.role}
                            </span>
                        </div>

                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border-glass)] flex items-center justify-center text-[var(--text-muted)]">
                                <User size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-[var(--text-primary)] text-lg leading-tight truncate pr-16">{u.full_name || 'Sin Nombre'}</h3>
                                <p className="text-sm text-[var(--text-muted)] truncate flex items-center gap-1 mt-1">
                                    <Mail size={12} className="opacity-70" /> {u.email}
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-[var(--border-glass)] flex items-center justify-between">
                            <div className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                                <Shield size={12} className="opacity-70" /> Creado: {new Date(u.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => openEditModal(u)}
                                    className="p-2 rounded-lg bg-[var(--bg-obsidian)] border border-[var(--border-glass)] text-[var(--text-primary)] hover:bg-[var(--brand-neon)]/10 hover:border-[var(--brand-neon)] hover:text-[var(--brand-neon)] transition-all hover:scale-105"
                                    title="Editar Usuario"
                                >
                                    <Edit2 size={15} />
                                </button>
                                {u.id !== currentUserId && (
                                    <button
                                        onClick={() => handleDeleteUser(u.id)}
                                        disabled={deletingId === u.id}
                                        className="p-2 rounded-lg bg-[var(--bg-obsidian)] border border-[var(--border-glass)] text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-all hover:scale-105"
                                        title="Revocar Acceso"
                                    >
                                        {deletingId === u.id ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={15} />}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Modal para agregar miembro */}
            {mounted && createPortal(
                <AnimatePresence>
                    {isAdding && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.95, y: 20 }}
                                className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl shadow-2xl overflow-hidden relative"
                            >
                                <div className="p-6 border-b border-[var(--border-glass)] flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-[var(--text-primary)]">{editingUser ? 'Editar Miembro' : 'Nuevo Miembro'}</h2>
                                    <button onClick={() => !loading && setIsAdding(false)} className="text-[var(--text-muted)] hover:text-white transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                                    {errorMsg && (
                                        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-2 text-sm text-red-400">
                                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                            <span>{errorMsg}</span>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Nombre Completo</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.fullName}
                                            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                            className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-neon)] transition-all"
                                            placeholder="Ej. Juan Pérez"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Email de Acceso</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-neon)] transition-all"
                                            placeholder="correo@empresa.com"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Asignar Rol</label>
                                            <select
                                                value={formData.role}
                                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                                                className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-neon)] transition-all appearance-none"
                                            >
                                                <option value="sales">Ventas (CRM)</option>
                                                <option value="operations">Operaciones</option>
                                                <option value="admin">Administrador global</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Contraseña</label>
                                            <input
                                                type="text"
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-neon)] transition-all"
                                                placeholder="Opcional. Autogenerada si vacío"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-[var(--border-glass)]">
                                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Accesos del Panel</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['crm', 'finance', 'metrics', 'settings', 'admin'].map(mod => {
                                                const isChecked = formData.modules.includes(mod)
                                                const labels: Record<string, string> = { crm: 'Pipeline CRM', finance: 'Facturación', metrics: 'Métricas', settings: 'Configuración', admin: 'Contenido Web' }
                                                return (
                                                    <label key={mod} className="flex items-center gap-2 cursor-pointer group">
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-[var(--brand-neon)] border-[var(--brand-neon)] text-black' : 'border-[var(--border-glass)] text-transparent group-hover:border-[var(--brand-neon)]/50'}`}>
                                                            {isChecked && <CheckCircle size={10} strokeWidth={4} />}
                                                        </div>
                                                        <span className="text-sm text-[var(--text-secondary)] group-hover:text-white transition-colors">{labels[mod]}</span>
                                                        <input type="checkbox" className="hidden" checked={isChecked} onChange={(e) => {
                                                            if (e.target.checked) setFormData({ ...formData, modules: [...formData.modules, mod] })
                                                            else setFormData({ ...formData, modules: formData.modules.filter(m => m !== mod) })
                                                        }} />
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsAdding(false)}
                                            disabled={loading}
                                            className="flex-1 py-3 px-4 rounded-xl border border-[var(--border-glass)] text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-obsidian)] transition-all text-sm font-bold"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 btn-premium text-sm font-bold flex justify-center items-center py-3"
                                        >
                                            {loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : (editingUser ? "Guardar Cambios" : "Crear Acceso")}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    )
}
