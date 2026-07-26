import { createClient } from '@/lib/supabase/client'
import { restoreRecord, softDeleteRecord } from '@/lib/database/soft-delete'
import { calculatePaid } from '@/lib/financial-calculations'
import type { WorkOrder, WorkOrderInsert, WorkOrderUpdate, WorkOrderStatus } from '@/lib/types'

const WORK_ORDER_SELECT = '*, vehicle:vehicles(*), customer:customers(*), line_items:line_items(*), payments:payments(*), linked_work_order:work_orders!linked_work_order_id(*)'

export interface WorkOrderLineInput {
  id?: string
  category: string
  item: string
  specification?: string | null
  part_number?: string | null
  quantity: number
  unit: string
  unit_price: number
  discount_type?: string | null
  discount_value?: number
  installation_status?: string | null
  notes?: string | null
  source_url?: string | null
  sort_order: number
}

async function requireWorkOrder(id: string): Promise<WorkOrder> {
  const workOrder = await getWorkOrderById(id)
  if (!workOrder) throw new Error('Work order was saved but could not be reloaded')
  return workOrder
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
    .limit(100)
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
    .limit(100)
  if (error) throw error
  return data as unknown as WorkOrder[]
}

export async function createWorkOrder(data: WorkOrderInsert): Promise<WorkOrder> {
  return createWorkOrderWithItems(data, [])
}

export async function createWorkOrderWithItems(
  data: WorkOrderInsert,
  lineItems: WorkOrderLineInput[],
): Promise<WorkOrder> {
  const supabase = createClient()
  const { data: id, error } = await supabase.rpc('create_work_order_with_items', {
    order_payload: data,
    items_payload: lineItems,
  })
  if (error) throw error
  if (typeof id !== 'string') throw new Error('Work order ID was not returned')
  return requireWorkOrder(id)
}

export async function transitionWorkOrderStatus(
  id: string,
  expectedVersion: number,
  status: WorkOrderStatus,
): Promise<WorkOrder> {
  const supabase = createClient()
  const { error } = await supabase.rpc('transition_work_order_status', {
    target_work_order_id: id,
    expected_version: expectedVersion,
    target_status: status,
  })
  if (error) throw error
  return requireWorkOrder(id)
}

export async function updateWorkOrderWithItems(
  id: string,
  expectedVersion: number,
  data: WorkOrderUpdate,
  lineItems: WorkOrderLineInput[],
): Promise<WorkOrder> {
  const supabase = createClient()
  const { data: updatedId, error } = await supabase.rpc('update_work_order_with_items', {
    target_work_order_id: id,
    expected_version: expectedVersion,
    order_payload: data,
    items_payload: lineItems,
  })
  if (error) throw error
  if (typeof updatedId !== 'string') throw new Error('Updated work order ID was not returned')
  return requireWorkOrder(updatedId)
}

export async function deleteWorkOrder(id: string): Promise<void> {
  const supabase = createClient()
  await softDeleteRecord(supabase, 'work_orders', id)
}

export async function copyWorkOrder(sourceId: string): Promise<WorkOrder> {
  const supabase = createClient()
  const { data: id, error } = await supabase.rpc('copy_work_order_transactional', {
    source_work_order_id: sourceId,
  })
  if (error) throw error
  if (typeof id !== 'string') throw new Error('Copied work order ID was not returned')
  return requireWorkOrder(id)
}

export async function restoreWorkOrder(id: string): Promise<void> {
  const supabase = createClient()
  await restoreRecord(supabase, 'work_orders', id)
}

export async function getPaymentsTotal(workOrderId: string): Promise<number> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('amount')
    .eq('work_order_id', workOrderId)
    .is('deleted_at', null)
  if (error) throw error
  return calculatePaid(data || [])
}
