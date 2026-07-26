import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isAuthEntryRoute, isPublicRoute, sanitizeReturnPath } from '@/lib/auth/routes'
import { env } from '@/lib/env'

function redirectWithCookies(url: URL, source: NextResponse) {
  const response = NextResponse.redirect(url)
  response.headers.set('Cache-Control', 'no-store')
  source.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))
  return response
}

function canonicalUrl(path: string) {
  return new URL(path, env.NEXT_PUBLIC_SITE_URL)
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  const publicRoute = isPublicRoute(pathname, env.NEXT_PUBLIC_ALLOW_SIGN_UP)

  if (!user && !publicRoute) {
    const url = canonicalUrl('/login')
    const returnPath = sanitizeReturnPath(`${pathname}${request.nextUrl.search}`)
    if (returnPath !== '/') url.searchParams.set('next', returnPath)
    return redirectWithCookies(url, supabaseResponse)
  }

  if (user && isAuthEntryRoute(pathname)) {
    const returnPath = sanitizeReturnPath(request.nextUrl.searchParams.get('next'))
    const url = canonicalUrl(returnPath)
    return redirectWithCookies(url, supabaseResponse)
  }

  return supabaseResponse
}
