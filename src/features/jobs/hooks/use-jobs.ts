'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getJobs,
  getJobById,
  getJobsByVehicle,
  createJob,
  updateJob,
  deleteJob,
} from '../actions'
import type { JobInsert, JobUpdate } from '@/lib/types'

export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: getJobs,
  })
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ['jobs', id],
    queryFn: () => getJobById(id),
    enabled: !!id,
  })
}

export function useJobsByVehicle(vehicleId: string) {
  return useQuery({
    queryKey: ['jobs', 'vehicle', vehicleId],
    queryFn: () => getJobsByVehicle(vehicleId),
    enabled: !!vehicleId,
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: JobInsert) => createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

export function useUpdateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: JobUpdate }) =>
      updateJob(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['jobs', variables.id] })
    },
  })
}

export function useDeleteJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}
