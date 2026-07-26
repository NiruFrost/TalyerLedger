import { getWorkOrdersByVehicle } from '@/features/work-orders/actions'

export interface TimelineEvent {
  id: string
  title: string
  status?: string
  date: string
  year: number
}

export async function getVehicleTimeline(vehicleId: string): Promise<TimelineEvent[]> {
  const workOrders = await getWorkOrdersByVehicle(vehicleId)
  return workOrders.map((workOrder) => {
    const firstItem = workOrder.line_items?.[0]?.item
    const date = new Date(workOrder.created_at)
    return {
      id: workOrder.id,
      title: firstItem || `Work Order #${workOrder.estimate_no}`,
      status: workOrder.status,
      date: workOrder.created_at,
      year: date.getFullYear(),
    }
  })
}
