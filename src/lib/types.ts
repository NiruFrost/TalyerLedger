export type JobStatus = 'draft' | 'estimate' | 'approved' | 'invoiced' | 'partially_paid' | 'paid' | 'closed'

export type LineItemCategory = 'fluids' | 'parts' | 'accessories' | 'labor' | 'other'

export type CurrencyCode = 'PHP' | 'USD' | 'EUR'

export type InstallationStatus = 'to_confirm' | 'ordered' | 'in_stock' | 'installed' | 'out_of_stock' | 'na'

export type DiscountType = 'amount' | 'percent'

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

export interface Job {
  id: string
  estimate_no: string
  vehicle_id: string
  customer_id: string | null
  status: JobStatus
  date: string
  prepared_by: string | null
  odometer: number | null
  currency: CurrencyCode
  overall_discount_type: DiscountType | null
  overall_discount_value: number
  notes: string | null
  terms: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  deleted_at: string | null
  vehicle?: Vehicle | null
  customer?: Customer | null
  line_items?: LineItem[]
  payments?: Payment[]
}

export interface JobInsert {
  vehicle_id: string
  customer_id?: string | null
  status?: JobStatus
  date?: string
  prepared_by?: string | null
  odometer?: number | null
  currency?: CurrencyCode
  overall_discount_type?: DiscountType | null
  overall_discount_value?: number
  notes?: string | null
  terms?: string | null
}

export type JobUpdate = Partial<JobInsert> & { status?: JobStatus }

export interface LineItem {
  id: string
  job_id: string
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
  job_id: string
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
  job_id: string | null
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
  job_id: string
  date: string
  amount: number
  payment_method: string
  reference_number: string | null
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  deleted_at: string | null
}

export interface PaymentInsert {
  job_id: string
  date: string
  amount: number
  payment_method: string
  reference_number?: string | null
  notes?: string | null
}

export interface DashboardStats {
  total_vehicles: number
  active_jobs: number
  total_customers: number
  monthly_revenue: number
  jobs_by_status: { status: JobStatus; count: number }[]
  recent_jobs: Job[]
}
