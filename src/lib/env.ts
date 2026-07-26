import { z } from 'zod'

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_ALLOW_SIGN_UP: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
})

export type PublicEnv = z.infer<typeof publicEnvSchema>

export function parsePublicEnv(
  values: Record<string, string | undefined>,
  nodeEnv = process.env.NODE_ENV,
): PublicEnv {
  const parsed = publicEnvSchema.safeParse(values)

  if (!parsed.success) {
    const fields = Object.keys(parsed.error.flatten().fieldErrors).join(', ')
    throw new Error(`Invalid public environment variables: ${fields}`)
  }

  const siteUrl = new URL(parsed.data.NEXT_PUBLIC_SITE_URL)
  const isLocal = ['localhost', '127.0.0.1'].includes(siteUrl.hostname)
  if (nodeEnv === 'production' && siteUrl.protocol !== 'https:' && !isLocal) {
    throw new Error('NEXT_PUBLIC_SITE_URL must use HTTPS in production')
  }

  return parsed.data
}

export const env = parsePublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_ALLOW_SIGN_UP: process.env.NEXT_PUBLIC_ALLOW_SIGN_UP,
})
