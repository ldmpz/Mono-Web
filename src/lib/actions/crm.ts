'use server'

import { createClient } from '../supabase/server'
import { revalidatePath } from 'next/cache'

// Server Action: Move a Kanban task
export async function moveKanbanTask(taskId: string, newStatus: string, assignedToId?: string) {
    const supabase = await createClient()

    const { data: client, error: fetchErr } = await supabase
        .from('clients')
        .select('notes')
        .eq('id', taskId)
        .single()

    if (fetchErr) {
        throw new Error(fetchErr.message)
    }

    const timeString = new Date().toLocaleString()
    const historyEntry = `[${timeString}] Estado actualizado a: ${newStatus}\n`
    const newNotes = (client.notes ? client.notes + '\n' : '') + historyEntry

    const updatePayload: Record<string, string> = { status: newStatus, notes: newNotes }
    if (assignedToId) { updatePayload.assigned_to = assignedToId }

    const { error } = await supabase
        .from('clients')
        .update(updatePayload)
        .eq('id', taskId)

    if (error) {
        throw new Error(error.message)
    }

    // ── AUTO-GENERATE INVOICES when client reaches "active" ──────────────
    if (newStatus === 'active') {
        await autoGenerateInvoicesForClient(taskId)
    }

    revalidatePath('/crm')
    revalidatePath('/finance')
    revalidatePath('/metrics')
}

/**
 * For each active service assigned to the client, create a pending invoice
 * only if one doesn't already exist (same client + description + pending).
 * This prevents duplicates if the card is toggled back and forth.
 */
async function autoGenerateInvoicesForClient(clientId: string) {
    const supabase = await createClient()

    // 1. Fetch the client's active services with their service details
    const { data: clientServices, error: svcErr } = await supabase
        .from('client_services')
        .select(`
            id,
            contract_value,
            billing_type,
            services ( name, description )
        `)
        .eq('client_id', clientId)
        .eq('status', 'active')

    if (svcErr || !clientServices || clientServices.length === 0) return

    // 2. Fetch existing PENDING invoices for this client to avoid duplicates
    const { data: existingInvoices } = await supabase
        .from('invoices')
        .select('description')
        .eq('client_id', clientId)
        .eq('status', 'pending')

    const existingDescriptions = new Set(
        (existingInvoices || []).map(inv => inv.description?.toLowerCase().trim())
    )

    // 3. Calculate due_date: end of current month
    const now = new Date()
    const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0) // last day of month
    const dueDateStr = dueDate.toISOString().split('T')[0]

    // 4. Build invoices to insert (skip already existing ones)
    const invoicesToInsert = clientServices
        .map(svc => {
            const serviceName = (svc.services as unknown as { name: string; description: string | null } | null)?.name || 'Servicio'
            const billingLabel = svc.billing_type === 'monthly' ? ' (Mensual)' : ' (Pago Único)'
            const description = `${serviceName}${billingLabel}`

            return {
                client_id: clientId,
                amount: Number(svc.contract_value),
                description,
                due_date: dueDateStr,
                status: 'pending' as const,
            }
        })
        .filter(inv => !existingDescriptions.has(inv.description.toLowerCase().trim()))

    if (invoicesToInsert.length === 0) return

    // 5. Insert the invoices
    await supabase.from('invoices').insert(invoicesToInsert)
}



// Server Action: Create a new Client Lead
export async function createClientLead(formData: FormData) {
    const supabase = await createClient()

    // Assuming we pass these from a form modal
    const company_name = formData.get('company_name') as string
    const contact_name = formData.get('contact_name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const source = formData.get('source') as string
    const assigned_to = formData.get('assigned_to') as string

    // Insert into db based on RLS (must be authenticated, if sales it limits assigned_to)
    // To simplify, we rely on RLS returning an error if they shouldn't insert.

    // We should get the user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    const { error } = await supabase
        .from('clients')
        .insert({
            company_name,
            contact_name,
            email,
            phone,
            source,
            status: 'lead',
            assigned_to: assigned_to || null,
        })

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/crm')
}

// Server Action: Delete a Client Lead
export async function deleteClientLead(clientId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/crm')
}

// Server Action: Update a Client Lead
export async function updateClientLead(clientId: string, data: {
    company_name?: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    source?: string;
    assigned_to?: string;
}) {
    const supabase = await createClient()

    // Enforce null instead of empty string for UUID column
    if (data.assigned_to === '') {
        data.assigned_to = undefined;
        (data as Record<string, unknown>).assigned_to = null;
    }

    const { error } = await supabase
        .from('clients')
        .update(data)
        .eq('id', clientId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/crm')
}

// Server Action: Get assignable users
export async function getAssignableUsers() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // We use the admin client to bypass RLS and auth restrictions so any authenticated user can view the sales team
    const { createAdminClient } = await import('../supabase/server')
    const adminAuthClient = await createAdminClient()

    // Fetch auth users using Admin API
    const { data: { users: authUsers }, error: authError } = await adminAuthClient.auth.admin.listUsers()
    if (authError) throw new Error(authError.message)

    // Merge them and return simple list
    return authUsers.map(au => ({
        id: au.id,
        email: au.email || '',
        full_name: au.user_metadata?.full_name || 'Usuario ' + au.email?.split('@')[0],
    }))
}
