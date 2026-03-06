import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoiceDocument } from '@/lib/pdf/InvoiceDocument'
import React from 'react'

// Admin client bypasses RLS for server-side generation
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const invoiceId = searchParams.get('id')

        if (!invoiceId) {
            return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
        }

        // 1. Fetch invoice with client data
        const { data: invoice, error: invoiceError } = await supabaseAdmin
            .from('invoices')
            .select(`
                *,
                clients (
                    id,
                    company_name,
                    contact_name,
                    email,
                    phone
                )
            `)
            .eq('id', invoiceId)
            .single()

        if (invoiceError || !invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
        }

        const client = Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients

        if (!client) {
            return NextResponse.json({ error: 'Client not found for this invoice' }, { status: 404 })
        }

        // 2. Generate PDF buffer — create element properly for renderToBuffer
        const element = React.createElement(InvoiceDocument, {
            invoice: {
                invoice_number: invoice.invoice_number || `INV-${invoiceId.slice(0, 6).toUpperCase()}`,
                status: invoice.status,
                amount: Number(invoice.amount),
                description: invoice.description || 'Servicio Profesional',
                created_at: invoice.created_at,
                due_date: invoice.due_date,
                payment_date: invoice.payment_date ?? null,
            },
            client: {
                company_name: client.company_name,
                contact_name: client.contact_name ?? null,
                email: client.email ?? null,
                phone: client.phone ?? null,
            }
        })

        // renderToBuffer returns a Node.js Buffer - convert to Uint8Array for Web APIs
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pdfBuffer: Buffer = await renderToBuffer(element as any)
        const pdfUint8Array = new Uint8Array(pdfBuffer)

        const fileName = `${invoice.invoice_number || invoiceId}.pdf`
        const filePath = `pdfs/${fileName}`

        // 3. Upload to Supabase Storage (bucket: invoices)
        const { error: uploadError } = await supabaseAdmin
            .storage
            .from('invoices')
            .upload(filePath, pdfUint8Array, {
                contentType: 'application/pdf',
                upsert: true,
            })

        if (!uploadError) {
            // 4. Get public URL and save to DB
            const { data: urlData } = supabaseAdmin
                .storage
                .from('invoices')
                .getPublicUrl(filePath)

            await supabaseAdmin
                .from('invoices')
                .update({ pdf_url: urlData.publicUrl })
                .eq('id', invoiceId)
        }

        // 5. Return PDF as downloadable response
        return new NextResponse(pdfUint8Array, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Cache-Control': 'no-store',
            },
        })

    } catch (error) {
        console.error('PDF generation error:', error)
        return NextResponse.json({
            error: 'Failed to generate PDF',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
