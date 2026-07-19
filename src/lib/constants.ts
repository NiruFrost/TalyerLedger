export const JOB_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-500' },
  { value: 'estimate', label: 'Estimate', color: 'bg-blue-500' },
  { value: 'approved', label: 'Approved', color: 'bg-green-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-500' },
  { value: 'completed', label: 'Completed', color: 'bg-emerald-500' },
  { value: 'released', label: 'Released', color: 'bg-purple-500' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-700' },
  { value: 'voided', label: 'Voided', color: 'bg-red-700' },
] as const

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['estimate'],
  estimate: ['approved'],
  approved: ['in_progress'],
  in_progress: ['completed'],
  completed: ['released'],
  released: ['closed'],
  closed: [],
  voided: [],
} as const

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
  { value: 'refund', label: 'Refund', color: 'text-blue-600 bg-blue-50 border-blue-200' },
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

export const ATTACHMENT_FILE_TYPES = [
  { value: 'image', label: 'Image', accept: 'image/jpeg,image/png,image/webp' },
  { value: 'pdf', label: 'PDF', accept: 'application/pdf' },
  { value: 'docx', label: 'Document', accept: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { value: 'xlsx', label: 'Spreadsheet', accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  { value: 'video', label: 'Video', accept: 'video/*' },
  { value: 'other', label: 'Other', accept: '' },
] as const

export const ATTACHMENT_CATEGORIES = [
  { value: 'before', label: 'Before', color: 'bg-blue-100 text-blue-700' },
  { value: 'during', label: 'During Repair', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'after', label: 'After', color: 'bg-green-100 text-green-700' },
  { value: 'damage', label: 'Damage', color: 'bg-red-100 text-red-700' },
  { value: 'vehicle_overview', label: 'Vehicle Overview', color: 'bg-gray-100 text-gray-700' },
  { value: 'odometer', label: 'Odometer', color: 'bg-purple-100 text-purple-700' },
  { value: 'vin', label: 'VIN', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'plate_number', label: 'Plate Number', color: 'bg-pink-100 text-pink-700' },
  { value: 'authorization_letter', label: 'Authorization Letter', color: 'bg-orange-100 text-orange-700' },
  { value: 'tool_condition_out', label: 'Tool Condition (Out)', color: 'bg-teal-100 text-teal-700' },
  { value: 'tool_condition_in', label: 'Tool Condition (In)', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700' },
] as const

export const ATTACHMENT_PARENT_TYPES = [
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'work_order', label: 'Work Order' },
  { value: 'line_item', label: 'Line Item' },
] as const

export const ATTACHMENT_ACCEPTED_MIMES = ['image/jpeg', 'image/png', 'image/webp']
export const ATTACHMENT_MAX_SIZE_MB = 10
export const ATTACHMENT_MAX_SIZE_BYTES = ATTACHMENT_MAX_SIZE_MB * 1024 * 1024
export const ATTACHMENT_THUMBNAIL_WIDTH = 400
export const ATTACHMENT_FULL_WIDTH = 1920

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

export const NOTIFICATION_EVENTS = [
  { value: 'pickup_ready', label: 'Pickup Ready' },
  { value: 'warranty_expiring', label: 'Warranty Expiring' },
  { value: 'payment_overdue', label: 'Payment Overdue' },
  { value: 'tool_overdue', label: 'Tool Overdue' },
  { value: 'scheduled_maintenance', label: 'Scheduled Maintenance' },
  { value: 'insurance_approved', label: 'Insurance Approved' },
] as const

export const ESTIMATE_NO_PATTERN = 'YY-MMDD-XXXXX'

export const SITE_NAME = 'TalyerLedger'
export const SITE_DESCRIPTION = 'Repair estimate, invoice, and vehicle record management system'
