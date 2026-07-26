import { beforeEach, describe, expect, it } from 'vitest'
import { checkRateLimit, clearRateLimitsForTests } from './rate-limit'

describe('checkRateLimit', () => {
  beforeEach(clearRateLimitsForTests)

  it('blocks requests over the limit until the window resets', () => {
    expect(checkRateLimit('upload:user', 2, 60_000, 1_000).allowed).toBe(true)
    expect(checkRateLimit('upload:user', 2, 60_000, 2_000).allowed).toBe(true)
    expect(checkRateLimit('upload:user', 2, 60_000, 3_000)).toEqual({
      allowed: false,
      retryAfterSeconds: 58,
    })
    expect(checkRateLimit('upload:user', 2, 60_000, 61_000).allowed).toBe(true)
  })
})
