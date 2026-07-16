import { createClient } from '@/lib/supabase/client'
import { generateEstimateNumber } from '@/lib/utils'
import type { Job, JobInsert, JobUpdate } from '@/lib/types'

export async function getJobs(): Promise<Job[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('jobs')
    .select('*, vehicle:vehicles(*), customer:customers(*)')
    .is('deleted_at', null)
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
    .select('*, vehicle:vehicles(*), customer:customers(*)')
    .eq('vehicle_id', vehicleId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createJob(data: JobInsert): Promise<Job> {
  const supabase = createClient()

  const { count, error: countError } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)
  if (countError) throw countError

  const estimate_no = generateEstimateNumber(count ?? 0)

  const { overall_discount_type, overall_discount_value, ...dbData } = data

  const { data: newJob, error } = await supabase
    .from('jobs')
    .insert({ ...dbData, estimate_no })
    .select('*, vehicle:vehicles(*), customer:customers(*)')
    .single()
  if (error) throw error
  return newJob
}

export async function updateJob(id: string, data: JobUpdate): Promise<Job> {
  const supabase = createClient()
  const { overall_discount_type, overall_discount_value, ...dbData } = data
  const { data: updatedJob, error } = await supabase
    .from('jobs')
    .update(dbData)
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
