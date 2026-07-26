import { NextResponse } from 'next/server'
import { sanitizeReturnPath } from '@/lib/auth/routes'
import { env } from '@/lib/env'
import { logger } from '@/lib/logging/logger'
import { createServerSupabaseClient } from '@/lib/supabase/server'

function noStoreRedirect(url: URL) {
  return NextResponse.redirect(url, {
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = sanitizeReturnPath(searchParams.get('next'))
  const siteUrl = new URL(env.NEXT_PUBLIC_SITE_URL)

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return noStoreRedirect(new URL(next, siteUrl))
    }
    logger.warn('auth_callback_failed', { errorCode: error.code })
  }

  return noStoreRedirect(new URL('/login?error=auth_callback_error', siteUrl))
}
