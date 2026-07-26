const ALWAYS_PUBLIC_ROUTES = ['/login', '/auth/callback'] as const

export function isPublicRoute(pathname: string, allowSignUp = false): boolean {
  if (ALWAYS_PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return true
  }
  return allowSignUp && (pathname === '/register' || pathname.startsWith('/register/'))
}

export function isAuthEntryRoute(pathname: string): boolean {
  return pathname === '/login' || pathname === '/register'
}

export function sanitizeReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/'
  if (value.includes('\\') || /[\u0000-\u001f\u007f]/.test(value)) return '/'

  try {
    const parsed = new URL(value, 'http://local')
    if (parsed.origin !== 'http://local') return '/'
    if (isAuthEntryRoute(parsed.pathname) || parsed.pathname.startsWith('/auth/callback')) return '/'
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return '/'
  }
}
