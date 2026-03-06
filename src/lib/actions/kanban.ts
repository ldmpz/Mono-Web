'use server'

import { createClient } from '../supabase/server'
import { revalidatePath } from 'next/cache'

export async function moveTask(taskId: string, newColumnId: string, newPosition: number) {
    const supabase = await createClient()

    // 1. Verify Authentication & RLS
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    // 2. Perform optimistic double precision update
    // The backend uses double precision so calculating position is fast and avoids N+1
    const { error } = await supabase
        .from('tasks')
        .update({
            column_id: newColumnId,
            position: newPosition,
            updated_at: new Date().toISOString()
        })
        .eq('id', taskId)

    if (error) {
        console.error('Failed to move task:', error)
        throw new Error('Failed to update task position')
    }

    // 3. Clear cache to reflect on next RSC render
    revalidatePath('/crm')

    return { success: true }
}
