import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

interface JobPDFProps {
  job: {
    estimate_no: string
    date: string
    status: string
    prepared_by?: string | null
    odometer?: number | null
    notes?: string | null
    terms?: string | null
    currency: string
    vehicle?: {
      make: string
      model: string
      year: number
      plate?: string | null
      vin?: string | null
    } | null
    customer?: {
      name: string
      email?: string | null
      phone?: string | null
      address?: string | null
    } | null
    line_items?: Array<{
      category: string
      item: string
      specification?: string | null
      part_number?: string | null
      quantity: number
      unit: string
      unit_price: number
      line_total: number
    }>
  }
  shopSettings?: {
    shop_name?: string | null
    address?: string | null
    contact_number?: string | null
    email?: string | null
    logo_url?: string | null
    tin?: string | null
    dti_bn?: string | null
    business_permit?: string | null
  }
}

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica', fontWeight: 400 },
    { src: 'Helvetica-Bold', fontWeight: 700 },
  ],
})

const CATEGORY_LABELS: Record<string, string> = {
  fluids: 'Fluids',
  parts: 'Parts',
  accessories: 'Accessories',
  labor: 'Labor',
  other: 'Other',
}

const CATEGORY_ORDER = ['fluids', 'parts', 'accessories', 'labor', 'other']

const CURRENCY_SYMBOLS: Record<string, string> = {
  PHP: '₱',
  USD: '$',
  EUR: '€',
}

const COLORS = {
  primary: '#1a1a2e',
  accent: '#e94560',
  gray: '#6b7280',
  lightGray: '#f3f4f6',
  border: '#d1d5db',
  white: '#ffffff',
}

const formatCurrency = (amount: number, currency: string): string => {
  const symbol = CURRENCY_SYMBOLS[currency] || currency
  const formatted = Math.abs(amount).toFixed(2)
  return `${symbol}${formatted}`
}

function getDocumentLabel(status: string): string {
  const estimateStatuses: string[] = ['draft', 'estimate']
  const releasedStatuses: string[] = ['released', 'closed']
  if (estimateStatuses.includes(status)) return 'Service Estimate'
  if (releasedStatuses.includes(status)) return 'Payment Acknowledgment'
  return 'Statement of Account'
}

interface GroupedCategory {
  category: string
  label: string
  items: NonNullable<JobPDFProps['job']['line_items']>
  subtotal: number
}

const groupLineItems = (items: NonNullable<JobPDFProps['job']['line_items']>): GroupedCategory[] => {
  const groups: Record<string, NonNullable<JobPDFProps['job']['line_items']>> = {}

  for (const item of items) {
    if (!groups[item.category]) groups[item.category] = []
    groups[item.category].push(item)
  }

  return CATEGORY_ORDER
    .filter((cat) => groups[cat])
    .map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat] || cat.charAt(0).toUpperCase() + cat.slice(1),
      items: groups[cat],
      subtotal: groups[cat].reduce((sum, item) => sum + item.line_total, 0),
    }))
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: COLORS.primary,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'column',
    flex: 1,
  },
  shopName: {
    fontSize: 22,
    fontWeight: 700,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  shopDetail: {
    fontSize: 8,
    color: COLORS.gray,
    marginTop: 2,
  },
  docType: {
    fontSize: 10,
    fontWeight: 700,
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  logoPlaceholderText: {
    fontSize: 8,
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.accent,
    marginBottom: 14,
    marginTop: 2,
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  infoBlock: {
    flex: 1,
    flexDirection: 'column',
  },
  infoBlockRight: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  infoTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 8,
    color: COLORS.primary,
    lineHeight: 1.6,
  },
  infoTextBold: {
    fontSize: 8,
    fontWeight: 700,
    color: COLORS.primary,
    lineHeight: 1.6,
  },
  estimateNo: {
    fontSize: 16,
    fontWeight: 700,
    color: COLORS.primary,
    marginBottom: 2,
  },
  statusBadge: {
    fontSize: 7,
    fontWeight: 700,
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  customerSection: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 10,
    fontWeight: 700,
    color: COLORS.primary,
    marginBottom: 2,
  },
  customerDetail: {
    fontSize: 8,
    color: COLORS.gray,
    lineHeight: 1.5,
  },
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingBottom: 4,
    marginBottom: 2,
  },
  tableHeaderText: {
    fontSize: 7,
    fontWeight: 700,
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  colQty: { width: 32, textAlign: 'center' },
  colUnit: { width: 36, textAlign: 'center' },
  colDesc: { flex: 1, paddingHorizontal: 4 },
  colPrice: { width: 62, textAlign: 'right' },
  colTotal: { width: 62, textAlign: 'right' },
  categoryHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray,
    paddingVertical: 3,
    paddingHorizontal: 4,
    marginTop: 3,
    marginBottom: 1,
  },
  categoryHeaderText: {
    fontSize: 7.5,
    fontWeight: 700,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lineItemRow: {
    flexDirection: 'row',
    paddingVertical: 2.5,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  lineItemText: {
    fontSize: 7.5,
    color: COLORS.primary,
  },
  lineItemDesc: {
    fontSize: 7.5,
    color: COLORS.primary,
    flex: 1,
    paddingHorizontal: 4,
  },
  lineItemSpec: {
    fontSize: 6.5,
    color: COLORS.gray,
  },
  subtotalRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  subtotalLabel: {
    fontSize: 7.5,
    fontWeight: 700,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  subtotalAmount: {
    fontSize: 7.5,
    fontWeight: 700,
    color: COLORS.primary,
    textAlign: 'right',
    width: 62,
  },
  grandTotalRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderTopWidth: 2,
    borderTopColor: COLORS.primary,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.primary,
  },
  grandTotalAmount: {
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.accent,
    textAlign: 'right',
    width: 62,
  },
  footerSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  footerBlock: {
    marginBottom: 8,
  },
  footerTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  footerText: {
    fontSize: 7.5,
    color: COLORS.gray,
    lineHeight: 1.5,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 10,
  },
  signatureLine: {
    width: 160,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 2,
    marginBottom: 2,
  },
  signatureLabel: {
    fontSize: 7,
    color: COLORS.gray,
  },
  footerNotice: {
    fontSize: 6.5,
    color: COLORS.gray,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  pageFooter: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageNumber: {
    fontSize: 7,
    color: COLORS.gray,
  },
  emptyState: {
    fontSize: 8,
    color: COLORS.gray,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
})

const JobPDF = ({ job, shopSettings }: JobPDFProps) => {
  const shopName = shopSettings?.shop_name || 'TalyerLedger Auto Repair'
  const shopAddress = shopSettings?.address
  const shopContact = shopSettings?.contact_number
  const shopEmail = shopSettings?.email
  const shopTin = shopSettings?.tin
  const shopDtiBn = shopSettings?.dti_bn
  const shopPermit = shopSettings?.business_permit
  const logoUrl = shopSettings?.logo_url

  const docLabel = getDocumentLabel(job.status)

  const displayOdometer = job.odometer != null ? `${job.odometer.toLocaleString()} km` : null

  const vehicleDisplay = job.vehicle
    ? `${job.vehicle.year} ${job.vehicle.make} ${job.vehicle.model}`
    : null

  const groupedItems = job.line_items ? groupLineItems(job.line_items) : []
  const grandTotal = job.line_items
    ? job.line_items.reduce((sum, item) => sum + item.line_total, 0)
    : 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.shopName}>{shopName}</Text>
            {shopAddress && <Text style={styles.shopDetail}>{shopAddress}</Text>}
            {shopContact && <Text style={styles.shopDetail}>Tel: {shopContact}</Text>}
            {shopEmail && <Text style={styles.shopDetail}>Email: {shopEmail}</Text>}
            {shopTin && <Text style={styles.shopDetail}>TIN: {shopTin}</Text>}
            {shopDtiBn && <Text style={styles.shopDetail}>DTI/BN: {shopDtiBn}</Text>}
            {shopPermit && <Text style={styles.shopDetail}>Permit: {shopPermit}</Text>}
            <Text style={styles.docType}>{docLabel}</Text>
          </View>
          {logoUrl ? (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoPlaceholderText}>LOGO</Text>
            </View>
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoPlaceholderText}>LOGO</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.infoSection}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>Vehicle Information</Text>
            {vehicleDisplay && <Text style={styles.infoTextBold}>{vehicleDisplay}</Text>}
            {job.vehicle?.plate && <Text style={styles.infoText}>Plate: {job.vehicle.plate}</Text>}
            {job.vehicle?.vin && <Text style={styles.infoText}>VIN: {job.vehicle.vin}</Text>}
            {displayOdometer && <Text style={styles.infoText}>Odometer: {displayOdometer}</Text>}
            {!job.vehicle && <Text style={styles.infoText}>N/A</Text>}
          </View>
          <View style={styles.infoBlockRight}>
            <Text style={styles.estimateNo}>{job.estimate_no}</Text>
            <Text style={styles.infoText}>Date: {job.date}</Text>
            {job.prepared_by && <Text style={styles.infoText}>Prepared By: {job.prepared_by}</Text>}
            <Text style={styles.statusBadge}>{docLabel}</Text>
          </View>
        </View>

        {job.customer && (
          <View style={styles.customerSection}>
            <Text style={styles.infoTitle}>Customer</Text>
            <Text style={styles.customerName}>{job.customer.name}</Text>
            {job.customer.email && <Text style={styles.customerDetail}>{job.customer.email}</Text>}
            {job.customer.phone && <Text style={styles.customerDetail}>{job.customer.phone}</Text>}
            {job.customer.address && <Text style={styles.customerDetail}>{job.customer.address}</Text>}
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colUnit]}>Unit</Text>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>Unit Price</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
          </View>

          {groupedItems.length === 0 && (
            <Text style={styles.emptyState}>No line items</Text>
          )}

          {groupedItems.map((group) => (
            <View key={group.category}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryHeaderText}>{group.label}</Text>
              </View>
              {group.items.map((item, idx) => {
                const desc = item.specification
                  ? `${item.item} - ${item.specification}${item.part_number ? ` (${item.part_number})` : ''}`
                  : item.part_number
                    ? `${item.item} (${item.part_number})`
                    : item.item
                return (
                  <View style={styles.lineItemRow} key={idx}>
                    <Text style={[styles.lineItemText, styles.colQty]}>{item.quantity}</Text>
                    <Text style={[styles.lineItemText, styles.colUnit]}>{item.unit}</Text>
                    <View style={styles.colDesc}>
                      <Text style={styles.lineItemText}>{desc}</Text>
                    </View>
                    <Text style={[styles.lineItemText, styles.colPrice]}>
                      {formatCurrency(item.unit_price, job.currency)}
                    </Text>
                    <Text style={[styles.lineItemText, styles.colTotal]}>
                      {formatCurrency(item.line_total, job.currency)}
                    </Text>
                  </View>
                )
              })}
              <View style={styles.subtotalRow}>
                <Text style={[styles.subtotalLabel, { flex: 1, paddingHorizontal: 4 }]}>
                  Subtotal: {group.label}
                </Text>
                <Text style={[styles.subtotalAmount]}>
                  {formatCurrency(group.subtotal, job.currency)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.grandTotalRow}>
          <Text style={[styles.grandTotalLabel, { flex: 1, paddingHorizontal: 4 }]}>
            Grand Total
          </Text>
          <Text style={styles.grandTotalAmount}>
            {formatCurrency(grandTotal, job.currency)}
          </Text>
        </View>

        {(job.notes || job.terms) && (
          <View style={styles.footerSection}>
            {job.notes && (
              <View style={styles.footerBlock}>
                <Text style={styles.footerTitle}>Notes</Text>
                <Text style={styles.footerText}>{job.notes}</Text>
              </View>
            )}
            {job.terms && (
              <View style={styles.footerBlock}>
                <Text style={styles.footerTitle}>Terms &amp; Conditions</Text>
                <Text style={styles.footerText}>{job.terms}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.signatureRow}>
          <View>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Approved By</Text>
          </View>
          <View>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Date</Text>
          </View>
        </View>

        <Text style={styles.footerNotice}>
          This is a computer-generated {docLabel.toLowerCase()} and is valid without a signature.
        </Text>

        <View style={styles.pageFooter}>
          <Text style={styles.pageNumber}>{shopName}</Text>
        </View>
      </Page>
    </Document>
  )
}

export default JobPDF
