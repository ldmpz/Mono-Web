import { create } from 'zustand'

export interface Task {
    id: string
    title: string
    description: string | null
    column_id: string
    position: number
    value_mrr: number
    client_id: string | null
    // relations mapped by supabase usually
}

export interface Column {
    id: string
    name: string
    position: number
    color_hex: string | null
}

interface KanbanState {
    columns: Column[]
    tasks: Task[]
    setInitialData: (cols: Column[], tks: Task[]) => void
    moveTaskOptimistic: (taskId: string, newColumnId: string, newPosition: number) => void
    rollback: (taskId: string, previousColumnId: string, previousPosition: number) => void
}

export const useKanbanStore = create<KanbanState>((set) => ({
    columns: [],
    tasks: [],
    setInitialData: (columns, tasks) => set({ columns, tasks }),

    moveTaskOptimistic: (taskId, newColumnId, newPosition) => set((state) => ({
        tasks: state.tasks.map(t =>
            t.id === taskId
                ? { ...t, column_id: newColumnId, position: newPosition }
                : t
        )
    })),

    rollback: (taskId, previousColumnId, previousPosition) => set((state) => ({
        // Reverts back the task if the server action fails
        tasks: state.tasks.map(t =>
            t.id === taskId
                ? { ...t, column_id: previousColumnId, position: previousPosition }
                : t
        )
    })),
}))
