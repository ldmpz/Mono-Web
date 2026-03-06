'use client'

import React, { useEffect } from 'react'
import { useKanbanStore, Task, Column } from '@/store/z-kanban'
import { moveTask } from '@/lib/actions/kanban'

interface Props {
    initialColumns: Column[]
    initialTasks: Task[]
}

export default function KanbanBoard({ initialColumns, initialTasks }: Props) {
    const { setInitialData, columns, tasks, moveTaskOptimistic, rollback } = useKanbanStore()

    useEffect(() => {
        // Inject the RSC fetched data locally into the store
        setInitialData(initialColumns, initialTasks)
    }, [initialColumns, initialTasks, setInitialData])

    const handleDragDrop = async (taskId: string, newColumnId: string, newIndex: number) => {
        const newPositionParam = newIndex * 10.0

        const task = tasks.find(t => t.id === taskId)
        if (!task) return

        const { column_id: oldColId, position: oldPos } = task

        moveTaskOptimistic(taskId, newColumnId, newPositionParam)

        try {
            await moveTask(taskId, newColumnId, newPositionParam)
        } catch (err) {
            console.error('Reverting Drag & Drop due to server error', err)
            rollback(taskId, oldColId, oldPos)
        }
    }
    void handleDragDrop // referenced to suppress unused-vars lint

    // Basic representation of the board
    return (
        <div className="flex gap-4 overflow-x-auto pb-4 pt-2 h-[calc(100vh-120px)]">
            {columns.map((col) => {
                const columnTasks = tasks.filter(t => t.column_id === col.id).sort((a, b) => a.position - b.position)

                return (
                    <div key={col.id} className="glass-panel w-80 flex-shrink-0 rounded-xl p-4 flex flex-col h-full bg-[var(--bg-surface)]">
                        <h3 className="font-semibold text-sm mb-4 tracking-wide text-[var(--text-muted)] flex items-center justify-between">
                            {col.name}
                            <span className="bg-black/30 text-xs px-2 py-1 rounded-full">{columnTasks.length}</span>
                        </h3>

                        <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
                            {columnTasks.map(t => (
                                <div
                                    key={t.id}
                                    className="bg-black/40 border border-[var(--border-glass)] p-3 rounded-lg cursor-grab glass-panel-hover"
                                >
                                    <p className="text-sm font-medium">{t.title}</p>
                                    <p className="text-xs text-[var(--brand-neon)] mt-2 font-mono" suppressHydrationWarning>
                                        ${t.value_mrr.toLocaleString()} MRR
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
