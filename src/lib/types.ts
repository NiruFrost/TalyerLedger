export type WorkOrderStatus = 'draft' | 'estimate' | 'approved' | 'in_progress' | 'completed' | 'released' | 'closed' | 'voided'

export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overpaid'

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

export interface Workshop {
  id: string
  owner_id: string
  name: string
  timezone: string
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  deleted_at: string | null
}

export interface WorkshopMember {
  workshop_id: string
  user_id: string
  role: 'owner' | 'member'
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  deleted_at: string | null
}

export interface Customer {
  id: string
  workshop_id: string
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
  workshop_id?: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  notes?: string | null
}

export type CustomerUpdate = Partial<CustomerInsert>

export interface Vehicle {
  id: string
  workshop_id: string
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
  workshop_id?: string
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
  workshop_id: string
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
  version: number
  vehicle?: Vehicle | null
  customer?: Customer | null
  line_items?: LineItem[]
  payments?: Payment[]
  linked_work_order?: WorkOrder | null
}

export interface WorkOrderInsert {
  workshop_id?: string
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
  workshop_id: string
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
  workshop_id?: string
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
  workshop_id: string
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
  workshop_id: string
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
  workshop_id?: string
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
  workshop_id: string
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
  workshop_id?: string
  work_order_id: string
  document_type: DocumentType
  title?: string | null
  status?: string
  generated_at?: string | null
}

export interface ActivityLog {
  id: string
  workshop_id: string
  work_order_id: string
  event_type: string
  description: string
  metadata: Record<string, unknown> | null
  created_at: string
  created_by: string | null
}

export interface Attachment {
  id: string
  workshop_id: string
  parent_type: AttachmentParentType
  parent_id: string
  attachment_type: AttachmentCategory
  file_kind: AttachmentFileType | null
  mime_type: string | null
  storage_path: string
  thumbnail_path: string | null
  caption: string | null
  file_size: number | null
  taken_at: string | null
  visibility: 'private' | 'workshop' | 'customer'
  original_filename: string | null
  width: number | null
  height: number | null
  display_order: number
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
  file_kind?: AttachmentFileType | null
  mime_type?: string | null
  storage_path: string
  thumbnail_path?: string | null
  caption?: string | null
  file_size?: number | null
  taken_at?: string | null
  visibility?: 'private' | 'workshop' | 'customer'
  original_filename?: string | null
  width?: number | null
  height?: number | null
  display_order?: number
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
  workshop_id: string
  work_order_id: string | null
  event_type: string
  title: string
  message: string | null
  metadata: Record<string, unknown> | null
  is_read: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  deleted_at: string | null
}

export interface LaborItem {
  id: string
  workshop_id: string
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
  workshop_id?: string
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
  workshop_id: string
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
  workshop_id?: string
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
  workshop_id: string
  package_id: string
  item_type: LineItemCategory
  name: string
  description: string | null
  quantity: number
  unit: string
  unit_price: number
  sort_order: number
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  deleted_at: string | null
}

export interface PackageItemInsert {
  workshop_id?: string
  item_type: LineItemCategory
  name: string
  description?: string | null
  quantity?: number
  unit?: string
  unit_price?: number
  sort_order?: number
}

export interface ActivityLogInsert {
  workshop_id?: string
  work_order_id: string
  event_type: string
  description: string
  metadata?: Record<string, unknown> | null
}

export interface NotificationInsert {
  workshop_id?: string
  work_order_id?: string | null
  event_type: string
  title: string
  message?: string | null
  metadata?: Record<string, unknown> | null
}

export interface ShopSettings {
  id: string
  workshop_id: string
  shop_name: string
  address: string | null
  contact_number: string | null
  email: string | null
  logo_url: string | null
  tax_id: string | null
  terms_conditions: string | null
  tin: string | null
  dti_bn: string | null
  business_permit: string | null
  include_photo_appendix: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  deleted_at: string | null
}

export interface ShopSettingsInsert {
  workshop_id?: string
  shop_name: string
  address?: string | null
  contact_number?: string | null
  email?: string | null
  logo_url?: string | null
  tax_id?: string | null
  terms_conditions?: string | null
  tin?: string | null
  dti_bn?: string | null
  business_permit?: string | null
  include_photo_appendix?: boolean
}

export type ShopSettingsUpdate = Partial<ShopSettingsInsert>

// Backward-compatible type aliases
/** @deprecated Use WorkOrder instead */
export type Job = WorkOrder
/** @deprecated Use WorkOrderInsert instead */
export type JobInsert = WorkOrderInsert
/** @deprecated Use WorkOrderUpdate instead */
export type JobUpdate = WorkOrderUpdate
/** @deprecated Use WorkOrderStatus instead */
export type JobStatus = WorkOrderStatus
