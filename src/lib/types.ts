export type WorkOrderStatus = 'draft' | 'estimate' | 'approved' | 'in_progress' | 'completed' | 'released' | 'closed' | 'voided'

export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refund'

export type PayerType = 'customer' | 'insurance' | 'both'

export type PaymentType = 'deposit' | 'regular'

export type LineItemCategory = 'fluids' | 'parts' | 'accessories' | 'labor' | 'other'

export type CurrencyCode = 'PHP' | 'USD' | 'EUR'

export type InstallationStatus = 'to_confirm' | 'ordered' | 'in_stock' | 'installed' | 'out_of_stock' | 'na'

export type DiscountType = 'amount' | 'percent'

export type DocumentType = 'estimate' | 'statement_of_account' | 'payment_acknowledgment' | 'job_order'

export type AttachmentFileType = 'image' | 'pdf' | 'docx' | 'xlsx' | 'video' | 'other'

export type AttachmentCategory = 'before' | 'during' | 'after' | 'damage' | 'vehicle_overview' | 'odometer' | 'vin' | 'plate_number' | 'authorization_letter' | 'tool_condition_out' | 'tool_condition_in' | 'other'

export type AttachmentParentType = 'vehicle' | 'work_order' | 'line_item'

export type NotificationEvent = 'pickup_ready' | 'warranty_expiring' | 'payment_overdue' | 'tool_overdue' | 'scheduled_maintenance' | 'insurance_approved'

export interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  deleted_at: string | null
  vehicles?: { count: number }[]
}

export interface CustomerInsert {
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  notes?: string | null
}

export type CustomerUpdate = Partial<CustomerInsert>

export interface Vehicle {
  id: string
  customer_id: string | null
  make: string
  model: string
  year: number
  engine: string | null
  transmission: string | null
  vin: string | null
  plate: string | null
  color: string | null
  cover_photo: string | null
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  deleted_at: string | null
  customer?: Customer | null
}

export interface VehicleInsert {
  customer_id?: string | null
  make: string
  model: string
  year: number
  engine?: string | null
  transmission?: string | null
  vin?: string | null
  plate?: string | null
  color?: string | null
  cover_photo?: string | null
  notes?: string | null
}

export type VehicleUpdate = Partial<VehicleInsert>

export interface WorkOrder {
  id: string
  estimate_no: string
  vehicle_id: string
  customer_id: string | null
  status: WorkOrderStatus
  payment_status: PaymentStatus
  payer_type: PayerType | null
  insurance_company: string | null
  insurance_policy_no: string | null
  insurance_claim_no: string | null
  linked_work_order_id: string | null
  date: string
  prepared_by: string | null
  odometer: number | null
  currency: CurrencyCode
  overall_discount_type: DiscountType | null
  overall_discount_value: number
  notes: string | null
  internal_notes: string | null
  terms: string | null
  dropoff_condition_notes: string | null
  dropoff_representative_name: string | null
  dropoff_representative_id: string | null
  dropoff_inspected_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  deleted_at: string | null
  vehicle?: Vehicle | null
  customer?: Customer | null
  line_items?: LineItem[]
  payments?: Payment[]
  linked_work_order?: WorkOrder | null
}

export interface WorkOrderInsert {
  vehicle_id: string
  customer_id?: string | null
  status?: WorkOrderStatus
  payment_status?: PaymentStatus
  payer_type?: PayerType | null
  insurance_company?: string | null
  insurance_policy_no?: string | null
  insurance_claim_no?: string | null
  linked_work_order_id?: string | null
  date?: string
  prepared_by?: string | null
  odometer?: number | null
  currency?: CurrencyCode
  overall_discount_type?: DiscountType | null
  overall_discount_value?: number
  notes?: string | null
  internal_notes?: string | null
  terms?: string | null
  dropoff_condition_notes?: string | null
  dropoff_representative_name?: string | null
  dropoff_representative_id?: string | null
  dropoff_inspected_at?: string | null
}

export type WorkOrderUpdate = Partial<WorkOrderInsert> & { status?: WorkOrderStatus; payment_status?: PaymentStatus }

export interface LineItem {
  id: string
  work_order_id: string
  category: LineItemCategory
  item: string
  specification: string | null
  part_number: string | null
  quantity: number
  unit: string
  unit_price: number
  line_total: number
  installation_status: InstallationStatus | null
  discount_type: DiscountType | null
  discount_value: number
  notes: string | null
  source_url: string | null
  is_inventory: boolean
  sort_order: number
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  deleted_at: string | null
}

export interface LineItemInsert {
  work_order_id: string
  category: LineItemCategory
  item: string
  specification?: string | null
  part_number?: string | null
  quantity?: number
  unit?: string
  unit_price?: number
  line_total?: number
  installation_status?: InstallationStatus | null
  discount_type?: DiscountType | null
  discount_value?: number
  notes?: string | null
  source_url?: string | null
  is_inventory?: boolean
  sort_order?: number
}

export type LineItemUpdate = Partial<LineItemInsert>

export interface Photo {
  id: string
  url: string
  thumbnail_url: string | null
  vehicle_id: string | null
  work_order_id: string | null
  line_item_id: string | null
  photo_type: 'before' | 'after' | 'damage' | 'vehicle_overview' | 'odometer'
  caption: string | null
  file_size: number | null
  mime_type: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  deleted_at: string | null
}

export interface Payment {
  id: string
  work_order_id: string
  date: string
  amount: number
  payment_method: string
  payment_type: PaymentType
  reference_number: string | null
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  deleted_at: string | null
}

export interface PaymentInsert {
  work_order_id: string
  date: string
  amount: number
  payment_method: string
  payment_type?: PaymentType
  reference_number?: string | null
  notes?: string | null
}

export type PaymentUpdate = Partial<PaymentInsert>

export interface Document {
  id: string
  work_order_id: string
  document_type: DocumentType
  title: string | null
  status: string
  generated_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  deleted_at: string | null
}

export interface DocumentInsert {
  work_order_id: string
  document_type: DocumentType
  title?: string | null
  status?: string
  generated_at?: string | null
}

export interface ActivityLog {
  id: string
  work_order_id: string
  event_type: string
  description: string
  metadata: Record<string, unknown> | null
  created_at: string
  created_by: string | null
}

export interface Attachment {
  id: string
  parent_type: AttachmentParentType
  parent_id: string
  attachment_type: AttachmentCategory
  mime_type: string | null
  storage_path: string
  thumbnail_path: string | null
  caption: string | null
  file_size: number | null
  taken_at: string | null
  uploaded_by: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  deleted_at: string | null
}

export interface AttachmentInsert {
  parent_type: AttachmentParentType
  parent_id: string
  attachment_type: AttachmentCategory
  mime_type?: string | null
  storage_path: string
  thumbnail_path?: string | null
  caption?: string | null
  file_size?: number | null
  taken_at?: string | null
}

export type AttachmentUpdate = Partial<AttachmentInsert> & { id: string }

export interface AttachmentWithUrl extends Attachment {
  signed_url: string
  thumbnail_signed_url: string | null
}

export interface DashboardStats {
  total_vehicles: number
  active_work_orders: number
  total_customers: number
  monthly_revenue: number
  work_orders_by_status: { status: WorkOrderStatus; count: number }[]
  recent_work_orders: WorkOrder[]
}

export interface Notification {
  id: string
  work_order_id: string | null
  event_type: string
  title: string
  message: string | null
  metadata: Record<string, unknown> | null
  is_read: boolean
  created_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface LaborItem {
  id: string
  name: string
  description: string | null
  category: LineItemCategory
  unit_price: number
  unit: string
  sort_order: number
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  deleted_at: string | null
}

export interface LaborItemInsert {
  name: string
  description?: string | null
  category?: LineItemCategory
  unit_price?: number
  unit?: string
  sort_order?: number
}

export type LaborItemUpdate = Partial<LaborItemInsert>

export interface ServicePackage {
  id: string
  name: string
  description: string | null
  category: string
  total_price: number | null
  sort_order: number
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  deleted_at: string | null
  items?: PackageItem[]
}

export interface ServicePackageInsert {
  name: string
  description?: string | null
  category?: string
  total_price?: number | null
  sort_order?: number
  items?: PackageItemInsert[]
}

export type ServicePackageUpdate = Partial<ServicePackageInsert>

export interface PackageItem {
  id: string
  package_id: string
  item_type: LineItemCategory
  name: string
  description: string | null
  quantity: number
  unit: string
  unit_price: number
  sort_order: number
  created_at: string
}

export interface PackageItemInsert {
  item_type: LineItemCategory
  name: string
  description?: string | null
  quantity?: number
  unit?: string
  unit_price?: number
  sort_order?: number
}

// Backward-compatible type aliases
/** @deprecated Use WorkOrder instead */
export type Job = WorkOrder
/** @deprecated Use WorkOrderInsert instead */
export type JobInsert = WorkOrderInsert
/** @deprecated Use WorkOrderUpdate instead */
export type JobUpdate = WorkOrderUpdate
/** @deprecated Use WorkOrderStatus instead */
export type JobStatus = WorkOrderStatus
