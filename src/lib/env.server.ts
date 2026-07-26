import 'server-only'
import { z } from 'zod'

const optionalSecret = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
)

export const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: optionalSecret,
  R2_ACCESS_KEY_ID: optionalSecret,
  R2_SECRET_ACCESS_KEY: optionalSecret,
  R2_BUCKET_NAME: optionalSecret,
  R2_ENDPOINT: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().url().optional(),
  ),
})

export function parseServerEnv(values: Record<string, string | undefined>) {
  const parsed = serverEnvSchema.safeParse(values)
  if (!parsed.success) {
    const fields = Object.keys(parsed.error.flatten().fieldErrors).join(', ')
    throw new Error(`Invalid server environment variables: ${fields}`)
  }
  return parsed.data
}

export const serverEnv = parseServerEnv({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
  R2_ENDPOINT: process.env.R2_ENDPOINT,
})
