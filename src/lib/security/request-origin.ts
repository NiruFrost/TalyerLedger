import { env } from '@/lib/env'

export function hasTrustedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return false

  try {
    return new URL(origin).origin === new URL(env.NEXT_PUBLIC_SITE_URL).origin
  } catch {
    return false
  }
}
