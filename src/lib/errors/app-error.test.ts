import { describe, expect, it } from 'vitest'
import { AppError, getAuthErrorMessage, getUserMessage } from './app-error'

describe('safe user-facing errors', () => {
  it('maps known authentication codes without exposing provider messages', () => {
    const providerError = {
      code: 'invalid_credentials',
      message: 'provider detail that should not be rendered',
    }

    expect(getAuthErrorMessage(providerError)).toBe('The email or password is incorrect.')
  })

  it('keeps unexpected internals out of user-facing messages', () => {
    expect(getUserMessage(new Error('database host and table details')))
      .toBe('Something went wrong. Try again, or contact support if it continues.')
  })

  it('preserves intentional application validation messages', () => {
    expect(getUserMessage(new AppError('VALIDATION_ERROR', 'Select a supported image.')))
      .toBe('Select a supported image.')
  })
})
