import { describe, expect, it } from 'vitest'
import { isPublicRoute, sanitizeReturnPath } from './routes'

describe('authentication routes', () => {
  it('keeps the callback public while registration is closed by default', () => {
    expect(isPublicRoute('/auth/callback')).toBe(true)
    expect(isPublicRoute('/register')).toBe(false)
    expect(isPublicRoute('/register', true)).toBe(true)
  })

  it.each(['https://evil.example', '//evil.example', '/\\evil', '/login', '/auth/callback?code=x'])(
    'rejects unsafe return path %s',
    (value) => expect(sanitizeReturnPath(value)).toBe('/'),
  )

  it('preserves a same-origin path and query', () => {
    expect(sanitizeReturnPath('/jobs/123?tab=photos')).toBe('/jobs/123?tab=photos')
  })
})
