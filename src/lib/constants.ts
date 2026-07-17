export const JOB_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-500' },
  { value: 'estimate', label: 'Estimate', color: 'bg-blue-500' },
  { value: 'approved', label: 'Approved', color: 'bg-green-500' },
  { value: 'invoiced', label: 'Invoiced', color: 'bg-purple-500' },
  { value: 'partially_paid', label: 'Partially Paid', color: 'bg-yellow-500' },
  { value: 'paid', label: 'Paid', color: 'bg-emerald-500' },
  { value: 'closed', label: 'Complete', color: 'bg-gray-700' },
  { value: 'voided', label: 'Voided', color: 'bg-red-700' },
] as const

export const LINE_ITEM_CATEGORIES = [
  { value: 'fluids', label: 'Fluids' },
  { value: 'parts', label: 'Parts' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'labor', label: 'Labor' },
  { value: 'other', label: 'Other' },
] as const

export const INSTALLATION_STATUSES = [
  { value: 'to_confirm', label: 'To Confirm', color: 'bg-amber-500' },
  { value: 'ordered', label: 'Ordered', color: 'bg-violet-500' },
  { value: 'in_stock', label: 'In Stock', color: 'bg-blue-500' },
  { value: 'installed', label: 'Installed', color: 'bg-green-500' },
  { value: 'out_of_stock', label: 'Out of Stock', color: 'bg-red-500' },
  { value: 'na', label: 'N/A', color: 'bg-gray-500' },
] as const

export const PAYMENT_STATUSES = [
  { value: 'unpaid', label: 'Unpaid', color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'partial', label: 'Partial', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { value: 'paid', label: 'Paid', color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'overpaid', label: 'Overpaid', color: 'text-blue-600 bg-blue-50 border-blue-200' },
] as const

export const CURRENCIES = [
  { value: 'PHP', label: '₱ PHP', symbol: '₱' },
  { value: 'USD', label: '$ USD', symbol: '$' },
  { value: 'EUR', label: '€ EUR', symbol: '€' },
] as const

export const UNITS = ['pc', 'pcs', 'L', 'mL', 'gal', 'qt', 'oz', 'kg', 'g', 'hr', 'set', 'pair', 'box', 'can', 'bottle', 'meter', 'day', 'service'] as const

export const PHOTO_TYPES = [
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'damage', label: 'Damage' },
  { value: 'vehicle_overview', label: 'Vehicle Overview' },
  { value: 'odometer', label: 'Odometer' },
] as const

export const PAYER_TYPES = [
  { value: 'customer', label: 'Customer' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'both', label: 'Both' },
] as const

export const PAYMENT_TYPES = [
  { value: 'deposit', label: 'Deposit' },
  { value: 'regular', label: 'Regular Payment' },
] as const

export const DOCUMENT_TYPES = [
  { value: 'estimate', label: 'Service Estimate' },
  { value: 'statement_of_account', label: 'Statement of Account' },
  { value: 'payment_acknowledgment', label: 'Payment Acknowledgment' },
  { value: 'job_order', label: 'Job Order' },
] as const

export const ATTACHMENT_TYPES = [
  { value: 'image', label: 'Image' },
  { value: 'pdf', label: 'PDF' },
  { value: 'docx', label: 'Document' },
  { value: 'xlsx', label: 'Spreadsheet' },
  { value: 'video', label: 'Video' },
  { value: 'other', label: 'Other' },
] as const

export const ATTACHMENT_PARENT_TYPES = [
  { value: 'work_order', label: 'Work Order' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'customer', label: 'Customer' },
  { value: 'line_item', label: 'Line Item' },
] as const

export const ACTIVITY_EVENTS = [
  'work_order_created',
  'work_order_status_changed',
  'line_item_added',
  'line_item_updated',
  'payment_added',
  'payment_updated',
  'attachment_added',
  'photo_added',
  'customer_created',
  'vehicle_added',
  'deposit_received',
  'work_order_released',
] as const

export const ESTIMATE_NO_PATTERN = 'YY-MMDD-XXXXX'

export const SITE_NAME = 'TalyerLedger'
export const SITE_DESCRIPTION = 'Repair estimate, invoice, and vehicle record management system'
