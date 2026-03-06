'use server'

import { createClient } from '../supabase/server'
import { revalidatePath } from 'next/cache'

// Server Action: Mark an invoice as paid
export async function markInvoicePaid(invoiceId: string, paymentMethod: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('invoices')
        .update({
            status: 'paid',
            payment_date: new Date().toISOString().split('T')[0],
            payment_method: paymentMethod
        })
        .eq('id', invoiceId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/finance')
    revalidatePath('/metrics') // Revalidate metrics as revenue just went up
}

// Server Action: Get clients for invoice dropdown
export async function getInvoiceClients() {
    const supabase = await createClient()

    const { data: clients, error } = await supabase
        .from('clients')
        .select('id, company_name')
        .order('company_name', { ascending: true })

    if (error) {
        throw new Error(error.message)
    }

    return clients
}

// Server Action: Create an Invoice
export async function createInvoice(formData: FormData) {
    const supabase = await createClient()

    const client_id = formData.get('client_id') as string;
    const amount = Number(formData.get('amount'));
    const description = formData.get('description') as string;
    const due_date = formData.get('due_date') as string;
    const status = formData.get('status') as string;

    const { error } = await supabase
        .from('invoices')
        .insert({
            client_id,
            amount,
            description,
            due_date,
            status
        });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath('/finance');
}

// Server Action: Update an Invoice
export async function updateInvoice(invoiceId: string, formData: FormData) {
    const supabase = await createClient()

    const client_id = formData.get('client_id') as string;
    const amount = Number(formData.get('amount'));
    const description = formData.get('description') as string;
    const due_date = formData.get('due_date') as string;
    const status = formData.get('status') as string;

    const { error } = await supabase
        .from('invoices')
        .update({
            client_id,
            amount,
            description,
            due_date,
            status
        })
        .eq('id', invoiceId);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath('/finance');
}

// Server Action: Delete an Invoice
export async function deleteInvoice(invoiceId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath('/finance');
    revalidatePath('/metrics');
}

// Future Server Action: Trigger Stripe Payment Link etc.
// export async function generatePaymentLink(invoiceId: string) { ... }
