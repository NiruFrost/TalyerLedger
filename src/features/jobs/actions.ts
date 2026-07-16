import { createClient } from '@/lib/supabase/client'
import { generateEstimateNumber } from '@/lib/utils'
import type { Job, JobInsert, JobUpdate, LineItem } from '@/lib/types'

export async function getJobs(): Promise<Job[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('jobs')
    .select('*, vehicle:vehicles(*), customer:customers(*), line_items:line_items(*)')
    .is('deleted_at', null)
    .is('line_items.deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getJobById(id: string): Promise<Job | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('jobs')
    .select('*, vehicle:vehicles(*), customer:customers(*), line_items:line_items(*), payments:payments(*)')
    .eq('id', id)
    .is('line_items.deleted_at', null)
    .is('payments.deleted_at', null)
    .single()
  if (error) throw error
  return data
}

export async function getJobsByVehicle(vehicleId: string): Promise<Job[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('jobs')
    .select('*, vehicle:vehicles(*), customer:customers(*), line_items:line_items(*)')
    .eq('vehicle_id', vehicleId)
    .is('deleted_at', null)
    .is('line_items.deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createJob(data: JobInsert): Promise<Job> {
  const supabase = createClient()

  const yearStart = `${new Date().getFullYear()}-01-01`
  const { count, error: countError } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)
    .gte('created_at', yearStart)
  if (countError) throw countError

  const estimate_no = generateEstimateNumber(count ?? 0)

  const { data: newJob, error } = await supabase
    .from('jobs')
    .insert({ ...data, estimate_no })
    .select('*, vehicle:vehicles(*), customer:customers(*)')
    .single()
  if (error) throw error
  return newJob
}

export async function updateJob(id: string, data: JobUpdate): Promise<Job> {
  const supabase = createClient()
  const { data: updatedJob, error } = await supabase
    .from('jobs')
    .update(data)
    .eq('id', id)
    .select('*, vehicle:vehicles(*), customer:customers(*)')
    .single()
  if (error) throw error
  return updatedJob
}

export async function deleteJob(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('jobs')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function copyJob(sourceId: string): Promise<Job> {
  const supabase = createClient()

  const { data: source, error: fetchErr } = await supabase
    .from('jobs')
    .select('*, line_items:line_items(*)')
    .eq('id', sourceId)
    .is('line_items.deleted_at', null)
    .single()
  if (fetchErr) throw fetchErr

  const yearStart = `${new Date().getFullYear()}-01-01`
  const { count, error: countError } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)
    .gte('created_at', yearStart)
  if (countError) throw countError

  const estimate_no = generateEstimateNumber(count ?? 0)

  const { data: newJob, error: insErr } = await supabase
    .from('jobs')
    .insert({
      vehicle_id: source.vehicle_id,
      customer_id: source.customer_id,
      status: 'draft',
      date: new Date().toISOString().split('T')[0],
      prepared_by: source.prepared_by,
      odometer: source.odometer,
      currency: source.currency,
      overall_discount_type: source.overall_discount_type,
      overall_discount_value: source.overall_discount_value,
      notes: source.notes,
      terms: source.terms,
      estimate_no,
    })
    .select('*, vehicle:vehicles(*), customer:customers(*)')
    .single()
  if (insErr) throw insErr

  const sourceLineItems = source.line_items as LineItem[] | undefined
  if (sourceLineItems && sourceLineItems.length > 0) {
    const lineItems = sourceLineItems.map((item, idx) => ({
      job_id: newJob.id,
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

  return newJob
}

export async function getPaymentsTotal(jobId: string): Promise<number> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('amount')
    .eq('job_id', jobId)
    .is('deleted_at', null)
  if (error) throw error
  return (data || []).reduce((sum, p) => sum + p.amount, 0)
}
