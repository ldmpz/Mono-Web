'use server'

import { createClient, createAdminClient } from '../supabase/server'
import { revalidatePath } from 'next/cache'

export async function createUserTeam(data: { email: string; password?: string; fullName: string; role: string; modules: string[] }) {
    const supabase = await createClient()

    // 1. Verify caller is Admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('No autorizado')

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
        throw new Error('Permisos insuficientes. Solo administradores pueden crear usuarios.')
    }

    // 2. Use Admin Client to create user bypassing signup limits
    const adminAuthClient = await createAdminClient()

    // We auto-generate a password if not provided (minimum 8 chars)
    const password = data.password || Math.random().toString(36).slice(-8) + 'A1!'

    const { data: newAuthUser, error: createError } = await adminAuthClient.auth.admin.createUser({
        email: data.email,
        password: password,
        email_confirm: true,
        user_metadata: { full_name: data.fullName }
    })

    if (createError) {
        console.error("Auth Create Error:", createError)
        throw new Error(createError.message)
    }

    // Supabase triggers generally handle inserting the row into public.users.
    // However, we need to explicitly set their role right after creation.
    const { error: roleError } = await adminAuthClient
        .from('users')
        .update({ role: data.role, modules: data.modules })
        .eq('id', newAuthUser.user.id)

    if (roleError) {
        console.error("Set Role Error:", roleError)
        // Not totally fatal, but role isn't set
        throw new Error("Usuario creado, pero hubo un error asignando el rol.")
    }

    revalidatePath('/team')

    return { success: true, user: newAuthUser.user }
}

// Optional helper to delete a user
export async function deleteUserTeam(userId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') throw new Error('Permisos insuficientes.')

    const adminAuthClient = await createAdminClient()

    // Deleting from auth.users automatically cascades to public.users if fk cascade is set, 
    // otherwise we must delete from auth.admin
    const { error } = await adminAuthClient.auth.admin.deleteUser(userId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function getTeamUsers() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') throw new Error('Permisos insuficientes.')

    const adminAuthClient = await createAdminClient()

    // Fetch auth users using Admin API
    const { data: { users: authUsers }, error: authError } = await adminAuthClient.auth.admin.listUsers()
    if (authError) throw new Error(authError.message)

    // Fetch public users using Admin API
    const { data: publicUsers, error: publicError } = await adminAuthClient.from('users').select('*')
    if (publicError) throw new Error(publicError.message)

    // Merge them
    const merged = authUsers.map(au => {
        const pUser = publicUsers?.find(pu => pu.id === au.id)
        return {
            id: au.id,
            email: au.email || '',
            full_name: au.user_metadata?.full_name || '',
            role: pUser?.role || 'sales',
            modules: pUser?.modules || ['crm', 'finance', 'metrics', 'settings', 'admin'],
            created_at: au.created_at,
            is_active: true
        }
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return merged
}

export async function updateUserTeam(userId: string, data: { fullName?: string, email?: string, role?: string, password?: string, modules?: string[] }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') throw new Error('Permisos insuficientes.')

    const adminAuthClient = await createAdminClient()

    const authUpdates: any = {}
    if (data.email) authUpdates.email = data.email
    if (data.password) authUpdates.password = data.password
    if (data.fullName) authUpdates.user_metadata = { full_name: data.fullName }

    if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await adminAuthClient.auth.admin.updateUserById(userId, authUpdates)
        if (authError) throw new Error(authError.message)
    }

    if (data.role || data.modules) {
        const { error: roleError } = await adminAuthClient
            .from('users')
            .update({
                ...(data.role ? { role: data.role } : {}),
                ...(data.modules ? { modules: data.modules } : {})
            })
            .eq('id', userId)
        if (roleError) throw new Error(roleError.message)
    }

    revalidatePath('/settings')
    return { success: true }
}
