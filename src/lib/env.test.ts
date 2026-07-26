import { describe, expect, it } from 'vitest'
import { parsePublicEnv } from './env'

const valid = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-anon-key',
  NEXT_PUBLIC_SITE_URL: 'https://ledger.example.com',
  NEXT_PUBLIC_ALLOW_SIGN_UP: 'false',
}

describe('parsePublicEnv', () => {
  it('parses browser-safe values and defaults sign-up closed', () => {
    const parsed = parsePublicEnv({ ...valid, NEXT_PUBLIC_ALLOW_SIGN_UP: undefined }, 'test')
    expect(parsed.NEXT_PUBLIC_ALLOW_SIGN_UP).toBe(false)
  })

  it('returns actionable missing-field errors', () => {
    expect(() => parsePublicEnv({ ...valid, NEXT_PUBLIC_SUPABASE_URL: undefined }, 'test'))
      .toThrow('NEXT_PUBLIC_SUPABASE_URL')
  })

  it('requires HTTPS for non-local production URLs', () => {
    expect(() => parsePublicEnv({ ...valid, NEXT_PUBLIC_SITE_URL: 'http://ledger.example.com' }, 'production'))
      .toThrow('must use HTTPS')
  })
})
