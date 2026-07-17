import { createClient } from '@/lib/supabase/client'
import { generateEstimateNumber } from '@/lib/utils'
import type { WorkOrder, WorkOrderInsert, WorkOrderUpdate, LineItem } from '@/lib/types'

const WORK_ORDER_SELECT = '*, vehicle:vehicles(*), customer:customers(*), line_items:line_items(*), payments:payments(*), linked_work_order:work_orders!linked_work_order_id(*)'

async function getNextEstimateNo(): Promise<string> {
  const supabase = createClient()
  const yearStart = `${new Date().getFullYear()}-01-01`
  const { count, error } = await supabase
    .from('work_orders')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)
    .gte('created_at', yearStart)
  if (error) throw error
  return generateEstimateNumber(count ?? 0)
}

export async function getWorkOrders(): Promise<WorkOrder[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('work_orders')
    .select(WORK_ORDER_SELECT)
    .is('deleted_at', null)
    .is('line_items.deleted_at', null)
    .is('payments.deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as WorkOrder[]
}

export async function getWorkOrderById(id: string): Promise<WorkOrder | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('work_orders')
    .select(WORK_ORDER_SELECT)
    .eq('id', id)
    .is('line_items.deleted_at', null)
    .is('payments.deleted_at', null)
    .single()
  if (error) throw error
  return data as unknown as WorkOrder
}

export async function getWorkOrdersByVehicle(vehicleId: string): Promise<WorkOrder[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('work_orders')
    .select(WORK_ORDER_SELECT)
    .eq('vehicle_id', vehicleId)
    .is('deleted_at', null)
    .is('line_items.deleted_at', null)
    .is('payments.deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as WorkOrder[]
}

export async function createWorkOrder(data: WorkOrderInsert): Promise<WorkOrder> {
  const supabase = createClient()
  const estimate_no = await getNextEstimateNo()
  const { data: newWorkOrder, error } = await supabase
    .from('work_orders')
    .insert({ ...data, estimate_no })
    .select('*, vehicle:vehicles(*), customer:customers(*)')
    .single()
  if (error) throw error
  return newWorkOrder
}

export async function updateWorkOrder(id: string, data: WorkOrderUpdate): Promise<WorkOrder> {
  const supabase = createClient()
  const { data: updated, error } = await supabase
    .from('work_orders')
    .update(data)
    .eq('id', id)
    .select('*, vehicle:vehicles(*), customer:customers(*)')
    .single()
  if (error) throw error
  return updated
}

export async function deleteWorkOrder(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('work_orders')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function copyWorkOrder(sourceId: string): Promise<WorkOrder> {
  const supabase = createClient()

  const { data: source, error: fetchErr } = await supabase
    .from('work_orders')
    .select('*, line_items:line_items(*)')
    .eq('id', sourceId)
    .is('line_items.deleted_at', null)
    .single()
  if (fetchErr) throw fetchErr

  const estimate_no = await getNextEstimateNo()

  const { data: newWorkOrder, error: insErr } = await supabase
    .from('work_orders')
    .insert({
      vehicle_id: source.vehicle_id,
      customer_id: source.customer_id,
      payer_type: source.payer_type,
      insurance_company: source.insurance_company,
      insurance_policy_no: source.insurance_policy_no,
      insurance_claim_no: source.insurance_claim_no,
      linked_work_order_id: source.linked_work_order_id,
      status: 'draft',
      date: new Date().toISOString().split('T')[0],
      prepared_by: source.prepared_by,
      odometer: source.odometer,
      currency: source.currency,
      overall_discount_type: source.overall_discount_type,
      overall_discount_value: source.overall_discount_value,
      notes: source.notes,
      internal_notes: source.internal_notes,
      terms: source.terms,
      estimate_no,
    })
    .select('*, vehicle:vehicles(*), customer:customers(*)')
    .single()
  if (insErr) throw insErr

  const sourceLineItems = source.line_items as LineItem[] | undefined
  if (sourceLineItems && sourceLineItems.length > 0) {
    const lineItems = sourceLineItems.map((item, idx) => ({
      work_order_id: newWorkOrder.id,
      category: item.category,
      item: item.item,
      specification: item.specification,
      part_number: item.part_number,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      line_total: item.line_total,
      discount_type: item.discount_type,
      discount_value: item.discount_value,
      installation_status: item.installation_status,
      notes: item.notes,
      is_inventory: item.is_inventory,
      sort_order: idx,
    }))

    const { error: liErr } = await supabase.from('line_items').insert(lineItems)
    if (liErr) throw liErr
  }

  return newWorkOrder
}

export async function restoreWorkOrder(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('work_orders')
    .update({ deleted_at: null })
    .eq('id', id)
  if (error) throw error
}

export async function getPaymentsTotal(workOrderId: string): Promise<number> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('amount')
    .eq('work_order_id', workOrderId)
    .is('deleted_at', null)
  if (error) throw error
  return (data || []).reduce((sum, p) => sum + p.amount, 0)
}
