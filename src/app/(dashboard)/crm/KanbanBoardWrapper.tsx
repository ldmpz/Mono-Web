'use client'

import { useState, useEffect, useRef } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { moveKanbanTask, deleteClientLead, getAssignableUsers } from '@/lib/actions/crm'
import { motion, AnimatePresence } from 'framer-motion'
import LeadModal from './LeadModal'

const COLUMNS = [
    { id: 'lead', title: 'Lead' },
    { id: 'contacted', title: 'Contactado' },
    { id: 'proposal_sent', title: 'Presupuesto Enviado' },
    { id: 'waiting_response', title: 'Esperando Respuesta' },
    { id: 'closed_won', title: 'Cerrado Ganado' },
    { id: 'closed_lost', title: 'Cerrado Perdido' },
    { id: 'onboarding', title: 'Onboarding' },
    { id: 'active', title: 'Activo' },
]

interface Client {
    id: string;
    company_name: string;
    status: string;
    contact_name?: string;
    email?: string;
    created_at: string;
    source?: string;
    [key: string]: unknown;
}

function DropdownMenu({ clientId, onDelete, onEdit }: { clientId: string, onDelete: (id: string) => void, onEdit: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="p-1.5 rounded-md hover:bg-white/10 text-[var(--text-muted)] transition-colors"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 mt-2 w-36 bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl shadow-2xl z-50 py-1 backdrop-blur-xl"
                    >
                        <button
                            className="w-full text-left px-4 py-2.5 text-xs text-white hover:bg-white/5 flex items-center gap-2 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit();
                                setIsOpen(false);
                            }}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            Editar
                        </button>
                        <div className="mx-3 my-1 border-t border-white/8" />
                        <button
                            className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('¿Estás seguro de eliminar este lead?')) {
                                    onDelete(clientId);
                                    setIsOpen(false);
                                }
                            }}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Eliminar
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function KanbanBoardWrapper({ initialClients }: { initialClients: Client[] }) {
    const [isMounted, setIsMounted] = useState(false)
    const [clients, setClients] = useState(initialClients)
    const [searchTerm, setSearchTerm] = useState('')
    const [editingClient, setEditingClient] = useState<Client | null>(null)
    const [viewFilter, setViewFilter] = useState<'all' | 'mine'>('all')
    const [assignableUsers, setAssignableUsers] = useState<{ id: string, full_name: string }[]>([])

    useEffect(() => {
        setIsMounted(true)
        getAssignableUsers().then(setAssignableUsers).catch(console.error)
    }, [])

    useEffect(() => {
        setClients(initialClients)
    }, [initialClients])

    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    useEffect(() => {
        // Fetch current user so we can implement 'Mis Leads' locally
        import('@/lib/supabase-client').then(m => {
            const supabase = m.createBrowserSupabaseClient()
            supabase.auth.getUser().then(({ data }) => {
                if (data?.user) setCurrentUserId(data.user.id)
            })
        })
    }, [])

    const filteredClients = clients.filter(c => {
        const matchesSearch = c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
        if (!matchesSearch) return false;

        if (viewFilter === 'mine' && currentUserId) {
            return c.assigned_to === currentUserId;
        }
        return true;
    })

    const handleDelete = async (id: string) => {
        // Optimistic UI
        setClients(prev => prev.filter(c => c.id !== id))
        try {
            await deleteClientLead(id)
        } catch (err) {
            console.error(err)
            alert("Error al eliminar")
            setClients(initialClients)
        }
    }

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result
        if (!destination) return
        if (destination.droppableId === source.droppableId && destination.index === source.index) return

        const newStatus = destination.droppableId

        // Optimistic UI update
        const updatedClients = clients.map(c =>
            c.id === draggableId ? { ...c, status: newStatus } : c
        )
        setClients(updatedClients)

        try {
            await moveKanbanTask(draggableId, newStatus)
        } catch (err) {
            console.error(err)
            alert("Error al mover el lead. Revirtiendo...")
            setClients(initialClients)
        }
    }

    if (!isMounted) return null

    return (
        <div className="flex flex-col h-full">
            {/* Inner Dashboard Toolbar */}
            <div className="flex items-center gap-4 mb-6 bg-[var(--bg-obsidian)]/40 p-1.5 rounded-xl border border-[var(--border-glass)] w-fit">
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Buscar empresa o contacto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-[var(--bg-obsidian)] border border-transparent rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[var(--brand-neon)]/50 focus:ring-1 focus:ring-[var(--brand-neon)]/20 transition-all w-64"
                    />
                </div>
                <div className="h-4 w-px bg-[var(--border-glass)]" />
                <button
                    onClick={() => setViewFilter('all')}
                    className={`text-[10px] font-bold px-2 py-1 transition-colors uppercase tracking-widest ${viewFilter === 'all' ? 'text-white' : 'text-[var(--text-muted)] hover:text-white/80'}`}
                >
                    Todos
                </button>
                <button
                    onClick={() => setViewFilter('mine')}
                    className={`text-[10px] font-bold px-2 py-1 transition-colors uppercase tracking-widest ${viewFilter === 'mine' ? 'text-white' : 'text-[var(--text-muted)] hover:text-white/80'}`}
                >
                    Mis Leads
                </button>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-5 overflow-x-auto pb-6 scroll-smooth h-full min-h-0">
                    {COLUMNS.map((col, colIdx) => {
                        const colClients = filteredClients.filter(c => c.status === col.id)

                        return (
                            <motion.div
                                key={col.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: colIdx * 0.05 }}
                                className="flex flex-col w-[300px] flex-shrink-0 group"
                            >
                                {/* Column Header */}
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-neon)]" />
                                        <h3 className="font-bold text-[11px] text-[var(--text-muted)] uppercase tracking-[0.15em] group-hover:text-white transition-colors">
                                            {col.title}
                                        </h3>
                                    </div>
                                    <span className="text-[10px] font-mono text-white/30 group-hover:text-[var(--brand-neon)] transition-colors">
                                        ({colClients.length})
                                    </span>
                                </div>

                                <Droppable droppableId={col.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className={`flex-1 flex flex-col gap-3 p-2 rounded-2xl transition-all duration-300 min-h-[500px] border border-transparent ${snapshot.isDraggingOver ? 'bg-[var(--brand-neon)]/5 border-[var(--brand-neon)]/20' : 'bg-black/5'}`}
                                        >
                                            <AnimatePresence>
                                                {colClients.map((client, index) => (
                                                    <Draggable key={client.id} draggableId={client.id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                            >
                                                                <motion.div
                                                                    layoutId={client.id}
                                                                    className={`bg-[var(--bg-surface)] border border-[var(--border-glass)] p-4 rounded-xl shadow-xl transition-all duration-300 cursor-grab active:cursor-grabbing ${snapshot.isDragging ? 'rotate-3 scale-105 shadow-[0_20px_40px_rgba(0,0,0,0.4)] border-[var(--brand-neon)]/50 z-50' : 'hover:border-[var(--border-highlight)] hover:-translate-y-1'}`}
                                                                >
                                                                    <div className="flex items-start justify-between mb-3">
                                                                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--brand-neon)]/20 to-transparent flex items-center justify-center border border-[var(--brand-neon)]/10 text-[var(--brand-neon)] font-bold text-xs">
                                                                            {client.company_name[0]}
                                                                        </div>

                                                                        <div className="flex items-center gap-2">
                                                                            {typeof client.assigned_to === 'string' && (() => {
                                                                                const user = assignableUsers.find(u => u.id === client.assigned_to as string);
                                                                                if (!user) return null;
                                                                                return (
                                                                                    <div
                                                                                        className="h-6 px-2.5 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white/50 font-medium text-[10px]"
                                                                                        title={`Asignado a: ${user.full_name}`}
                                                                                    >
                                                                                        {user.full_name.split(' ')[0]}
                                                                                    </div>
                                                                                );
                                                                            })()}

                                                                            <DropdownMenu
                                                                                clientId={client.id}
                                                                                onDelete={handleDelete}
                                                                                onEdit={() => setEditingClient(client)}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <h4 className="text-sm font-bold text-white mb-1 leading-tight group-hover:text-[var(--brand-neon)] transition-colors">
                                                                        {client.company_name}
                                                                    </h4>
                                                                    <p className="text-[11px] text-[var(--text-muted)] font-medium">
                                                                        {client.contact_name || 'Sin contacto'}
                                                                    </p>

                                                                    <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                                                                        <div className="flex items-center gap-1.5 text-[9px] text-white/30 font-bold uppercase tracking-widest">
                                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                                            {new Date(client.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                        </div>
                                                                        <div className="px-2 py-0.5 rounded text-[9px] font-bold bg-[var(--brand-neon)]/10 text-[var(--brand-neon)] uppercase tracking-tighter border border-[var(--brand-neon)]/20">
                                                                            {client.source || 'Directo'}
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </Droppable>
                            </motion.div>
                        )
                    })}
                </div>
            </DragDropContext>

            {/* Modal de edición */}
            {editingClient && (
                <LeadModal
                    isEditing
                    initialData={editingClient}
                    onClose={() => setEditingClient(null)}
                />
            )}
        </div>
    )
}
