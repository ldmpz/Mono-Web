import React from 'react'
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
} from '@react-pdf/renderer'

// Register clean fonts
Font.register({
    family: 'Inter',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff', fontWeight: 400 },
        { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff', fontWeight: 700 },
    ],
})

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 10,
        backgroundColor: '#FFFFFF',
        paddingTop: 50,
        paddingBottom: 60,
        paddingHorizontal: 50,
        color: '#1a1a2e',
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 40,
        paddingBottom: 24,
        borderBottom: '2pt solid #0066FF',
    },
    companyBlock: {
        flexDirection: 'column',
    },
    companyName: {
        fontSize: 28,
        fontFamily: 'Helvetica-Bold',
        color: '#0066FF',
        letterSpacing: 2,
    },
    companyTagline: {
        fontSize: 9,
        color: '#888',
        marginTop: 3,
        letterSpacing: 1,
    },
    invoiceMeta: {
        alignItems: 'flex-end',
    },
    invoiceTitle: {
        fontSize: 22,
        fontFamily: 'Helvetica-Bold',
        color: '#1a1a2e',
        letterSpacing: 1,
    },
    invoiceNumber: {
        fontSize: 11,
        color: '#0066FF',
        marginTop: 4,
        fontFamily: 'Helvetica-Bold',
    },
    invoiceDate: {
        fontSize: 9,
        color: '#888',
        marginTop: 3,
    },
    // Status badge
    statusBadge: {
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: 'flex-end',
    },
    statusText: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    // Billing section
    billingSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    billingBlock: {
        flex: 1,
    },
    billingTitle: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    billingName: {
        fontSize: 13,
        fontFamily: 'Helvetica-Bold',
        color: '#1a1a2e',
        marginBottom: 4,
    },
    billingDetail: {
        fontSize: 9,
        color: '#555',
        lineHeight: 1.5,
    },
    // Table
    table: {
        marginBottom: 30,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#0066FF',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 4,
    },
    tableHeaderText: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottom: '1pt solid #f0f0f0',
    },
    tableRowAlt: {
        backgroundColor: '#f8f9ff',
    },
    colDescription: { flex: 3 },
    colQty: { flex: 1, textAlign: 'right' },
    colRate: { flex: 1.5, textAlign: 'right' },
    colAmount: { flex: 1.5, textAlign: 'right' },
    tableCell: {
        fontSize: 9,
        color: '#333',
    },
    tableCellBold: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: '#1a1a2e',
    },
    // Totals
    totalsSection: {
        alignItems: 'flex-end',
        marginBottom: 40,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 4,
    },
    totalLabel: {
        fontSize: 9,
        color: '#888',
        width: 100,
        textAlign: 'right',
        marginRight: 16,
    },
    totalValue: {
        fontSize: 9,
        color: '#333',
        width: 80,
        textAlign: 'right',
        fontFamily: 'Helvetica-Bold',
    },
    grandTotalRow: {
        flexDirection: 'row',
        backgroundColor: '#0066FF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 4,
        marginTop: 8,
        alignItems: 'center',
    },
    grandTotalLabel: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: '#FFFFFF',
        flex: 1,
        textAlign: 'right',
        marginRight: 16,
    },
    grandTotalValue: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        color: '#FFFFFF',
        width: 100,
        textAlign: 'right',
    },
    // Due date box (pending/overdue)
    dueDateBox: {
        backgroundColor: '#fff8e7',
        borderLeft: '3pt solid #f59e0b',
        padding: 12,
        borderRadius: 4,
        marginBottom: 30,
        flexDirection: 'row',
        alignItems: 'center',
    },
    dueDateLabel: {
        fontSize: 9,
        color: '#92400e',
        fontFamily: 'Helvetica-Bold',
        marginRight: 8,
    },
    dueDateValue: {
        fontSize: 9,
        color: '#92400e',
    },
    // Paid date box
    paidDateBox: {
        backgroundColor: '#f0fdf4',
        borderLeft: '3pt solid #16a34a',
        padding: 12,
        borderRadius: 4,
        marginBottom: 30,
        flexDirection: 'row',
        alignItems: 'center',
    },
    paidDateLabel: {
        fontSize: 9,
        color: '#15803d',
        fontFamily: 'Helvetica-Bold',
        marginRight: 8,
    },
    paidDateValue: {
        fontSize: 9,
        color: '#15803d',
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 50,
        right: 50,
        borderTop: '1pt solid #e5e7eb',
        paddingTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 8,
        color: '#aaa',
    },
    footerBrand: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#0066FF',
    },
})

interface InvoiceDocumentProps {
    invoice: {
        invoice_number: string;
        status: string;
        amount: number;
        description: string;
        created_at: string;
        due_date: string;
        payment_date?: string | null;
    };
    client: {
        company_name: string;
        contact_name?: string | null;
        email?: string | null;
        phone?: string | null;
    };
}

function getStatusColor(status: string): { bg: string; text: string } {
    switch (status) {
        case 'paid': return { bg: '#dcfce7', text: '#16a34a' };
        case 'overdue': return { bg: '#fee2e2', text: '#dc2626' };
        default: return { bg: '#fef9c3', text: '#ca8a04' };
    }
}

function formatDate(dateStr: string): string {
    try {
        return new Date(dateStr).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
        return dateStr
    }
}

function formatCurrency(amount: number): string {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function InvoiceDocument({ invoice, client }: InvoiceDocumentProps) {
    const statusColors = getStatusColor(invoice.status)
    const statusLabels: Record<string, string> = { paid: 'PAGADO', pending: 'PENDIENTE', overdue: 'VENCIDO' }

    return (
        <Document title={`Factura ${invoice.invoice_number}`} author="MONO Agency">
            <Page size="A4" style={styles.page}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.companyBlock}>
                        <Text style={styles.companyName}>MONO</Text>
                        <Text style={styles.companyTagline}>AGENCIA CREATIVA DIGITAL</Text>
                    </View>
                    <View style={styles.invoiceMeta}>
                        <Text style={styles.invoiceTitle}>FACTURA</Text>
                        <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
                        <Text style={styles.invoiceDate}>Emitida: {formatDate(invoice.created_at)}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                            <Text style={[styles.statusText, { color: statusColors.text }]}>
                                {statusLabels[invoice.status] || invoice.status.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Billing Section */}
                <View style={styles.billingSection}>
                    <View style={styles.billingBlock}>
                        <Text style={styles.billingTitle}>Facturado por</Text>
                        <Text style={styles.billingName}>MONO Agency</Text>
                        <Text style={styles.billingDetail}>contacto@monoagency.com</Text>
                        <Text style={styles.billingDetail}>Ciudad de México, México</Text>
                    </View>
                    <View style={styles.billingBlock}>
                        <Text style={styles.billingTitle}>Facturado a</Text>
                        <Text style={styles.billingName}>{client.company_name}</Text>
                        {client.contact_name && <Text style={styles.billingDetail}>{client.contact_name}</Text>}
                        {client.email && <Text style={styles.billingDetail}>{client.email}</Text>}
                        {client.phone && <Text style={styles.billingDetail}>{client.phone}</Text>}
                    </View>
                </View>

                {/* Date section: paid = green box, pending/overdue = amber box */}
                {invoice.status === 'paid' ? (
                    <View style={styles.paidDateBox}>
                        <Text style={styles.paidDateLabel}>✓  Fecha de Pago:</Text>
                        <Text style={styles.paidDateValue}>
                            {formatDate(invoice.payment_date ?? invoice.due_date)}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.dueDateBox}>
                        <Text style={styles.dueDateLabel}>Fecha Límite de Pago:</Text>
                        <Text style={styles.dueDateValue}>{formatDate(invoice.due_date)}</Text>
                    </View>
                )}

                {/* Services Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderText, styles.colDescription]}>Descripción</Text>
                        <Text style={[styles.tableHeaderText, styles.colQty]}>Cant.</Text>
                        <Text style={[styles.tableHeaderText, styles.colRate]}>Tarifa</Text>
                        <Text style={[styles.tableHeaderText, styles.colAmount]}>Total</Text>
                    </View>

                    <View style={styles.tableRow}>
                        <Text style={[styles.tableCellBold, styles.colDescription]}>{invoice.description || 'Servicio Profesional'}</Text>
                        <Text style={[styles.tableCell, styles.colQty]}>1</Text>
                        <Text style={[styles.tableCell, styles.colRate]}>{formatCurrency(invoice.amount)}</Text>
                        <Text style={[styles.tableCellBold, styles.colAmount]}>{formatCurrency(invoice.amount)}</Text>
                    </View>
                </View>

                {/* Totals */}
                <View style={styles.totalsSection}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Subtotal</Text>
                        <Text style={styles.totalValue}>{formatCurrency(invoice.amount)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>IVA (16%)</Text>
                        <Text style={styles.totalValue}>{formatCurrency(invoice.amount * 0.16)}</Text>
                    </View>
                    <View style={styles.grandTotalRow}>
                        <Text style={styles.grandTotalLabel}>TOTAL</Text>
                        <Text style={styles.grandTotalValue}>{formatCurrency(invoice.amount * 1.16)}</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>Este documento es una factura oficial. {invoice.invoice_number}</Text>
                    <Text style={styles.footerBrand}>MONO Agency</Text>
                </View>

            </Page>
        </Document>
    )
}
