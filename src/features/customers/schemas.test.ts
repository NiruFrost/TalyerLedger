import { describe, expect, it } from 'vitest'
import { customerSchema } from './schemas'

describe('customerSchema', () => {
  it('normalizes valid input', () => {
    const customer = customerSchema.parse({ name: '  ACME Fleet  ', email: '' })
    expect(customer.name).toBe('ACME Fleet')
  })

  it('rejects invalid email and oversized names', () => {
    expect(customerSchema.safeParse({ name: 'A'.repeat(161), email: 'invalid' }).success).toBe(false)
  })
})
