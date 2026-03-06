import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Edge function to orchestrate monthly billing
// This function should be triggered via pg_cron or an external cron scheduler daily.

Deno.serve(async (req) => {
    try {
        // const authHeader = req.headers.get('Authorization')
        console.log("Running Billing Orchestrator...")

        // Create a Supabase client with the Auth context of the user hitting the edge function
        // For a cron job, you'd typically use the Service Role Key
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Find all active services billed monthly where today matches the billing day
        const today = new Date().getDate()
        console.log(`Checking for monthly billing on day: ${today}`)

        const { data: activeServices, error: fetchError } = await supabase
            .from('client_services')
            .select(`
                id,
                client_id,
                contract_value,
                monthly_billing_day,
                status
            `)
            .eq('status', 'active')
            .eq('billing_type', 'monthly')
            .eq('monthly_billing_day', today)

        if (fetchError) throw new Error(`Error fetching services: ${fetchError.message}`)

        if (!activeServices || activeServices.length === 0) {
            return new Response(JSON.stringify({ message: "No invoices to generate today." }), { status: 200 })
        }

        // 2. Generate Invoices
        const invoicesToInsert = activeServices.map(service => {
            const dueDate = new Date()
            dueDate.setDate(dueDate.getDate() + 15) // Due in 15 days

            return {
                client_id: service.client_id,
                amount: service.contract_value,
                due_date: dueDate.toISOString().split('T')[0],
                status: 'pending' as const
            }
        })

        const { error: insertError } = await supabase
            .from('invoices')
            .insert(invoicesToInsert)

        if (insertError) throw new Error(`Error generating invoices: ${insertError.message}`)


        // 3. Mark old pending invoices as overdue
        const { error: overdueError } = await supabase
            .from('invoices')
            .update({ status: 'overdue' })
            .eq('status', 'pending')
            .lt('due_date', new Date().toISOString().split('T')[0])

        if (overdueError) throw new Error(`Error marking overdue invoices: ${overdueError.message}`)

        return new Response(JSON.stringify({
            message: `Successfully generated ${invoicesToInsert.length} invoices.`,
            generated: invoicesToInsert.length
        }), {
            headers: { "Content-Type": "application/json" },
            status: 200
        })

    } catch (err) {
        console.error(err)
        return new Response(JSON.stringify({ error: err.message }), { status: 500 })
    }
})
