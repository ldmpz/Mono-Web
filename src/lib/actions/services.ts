'use server'

import { createClient } from '../supabase/server'
import { revalidatePath } from 'next/cache'

// Get all services for a specific client
export async function getClientServices(clientId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('client_services')
        .select(`
            id,
            billing_type,
            contract_value,
            start_date,
            renewal_date,
            status,
            monthly_billing_day,
            services ( id, name, description )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data || []
}

// Get all available base services (catalog)
export async function getServicesCatalog() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('services')
        .select('id, name, description, base_price, billing_type')
        .order('name')

    if (error) throw new Error(error.message)
    return data || []
}

// Create a service and assign it to a client in one step
export async function addClientService(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const client_id = formData.get('client_id') as string
    const service_name = formData.get('service_name') as string
    const description = formData.get('description') as string | null
    const billing_type = formData.get('billing_type') as 'monthly' | 'one_time'
    const contract_value = Number(formData.get('contract_value'))
    const start_date = formData.get('start_date') as string
    const renewal_date = formData.get('renewal_date') as string | null

    if (!client_id || !service_name || !billing_type || isNaN(contract_value)) {
        throw new Error('Faltan datos requeridos')
    }

    // 1. Check if the service already exists in the catalog to avoid duplicates
    let { data: service, error: serviceError } = await supabase
        .from('services')
        .select('id')
        .eq('name', service_name)
        .eq('billing_type', billing_type)
        .maybeSingle()

    if (!service) {
        // Create new service entry if it doesn't exist
        const { data: newService, error: insertError } = await supabase
            .from('services')
            .insert({
                name: service_name,
                description: description || null,
                base_price: contract_value,
                billing_type,
            })
            .select('id')
            .single()

        if (insertError) throw new Error(`Error creating service: ${insertError.message}`)
        service = newService
    }

    if (!service) throw new Error('Failed to identify or create service')

    // 2. Link the service to the client
    const { error: linkError } = await supabase
        .from('client_services')
        .insert({
            client_id,
            service_id: service.id,
            billing_type,
            contract_value,
            start_date: start_date || new Date().toISOString().split('T')[0],
            renewal_date: renewal_date || null,
            status: 'active',
        })

    if (linkError) throw new Error(linkError.message)

    revalidatePath('/crm')
    revalidatePath('/metrics')
}

// Update client service status
export async function updateClientServiceStatus(
    serviceId: string,
    status: 'active' | 'paused' | 'cancelled'
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('client_services')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', serviceId)

    if (error) throw new Error(error.message)
    revalidatePath('/crm')
    revalidatePath('/metrics')
}

// Delete a client service
export async function deleteClientService(serviceId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('client_services')
        .delete()
        .eq('id', serviceId)

    if (error) throw new Error(error.message)
    revalidatePath('/crm')
    revalidatePath('/metrics')
}
