export type AppErrorCode =
  | 'AUTHENTICATION_REQUIRED'
  | 'AUTHORIZATION_DENIED'
  | 'CONFLICT'
  | 'NETWORK_ERROR'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'UNEXPECTED_ERROR'

const DEFAULT_MESSAGES: Record<AppErrorCode, string> = {
  AUTHENTICATION_REQUIRED: 'Please sign in to continue.',
  AUTHORIZATION_DENIED: 'You do not have permission to perform this action.',
  CONFLICT: 'This record changed while you were working. Refresh and try again.',
  NETWORK_ERROR: 'The network is unavailable. Check your connection and try again.',
  NOT_FOUND: 'The requested record could not be found.',
  VALIDATION_ERROR: 'Check the highlighted information and try again.',
  UNEXPECTED_ERROR: 'Something went wrong. Try again, or contact support if it continues.',
}

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message = DEFAULT_MESSAGES[code],
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function getUserMessage(error: unknown): string {
  if (error instanceof AppError) return error.message
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String(error.code)
    if (code === '40001') return DEFAULT_MESSAGES.CONFLICT
    if (code === '42501') return DEFAULT_MESSAGES.AUTHORIZATION_DENIED
    if (code === 'P0002') return DEFAULT_MESSAGES.NOT_FOUND
    if (code === '23514' || code === '22023') return DEFAULT_MESSAGES.VALIDATION_ERROR
  }
  if (error instanceof TypeError && error.message.toLowerCase().includes('fetch')) {
    return DEFAULT_MESSAGES.NETWORK_ERROR
  }
  return DEFAULT_MESSAGES.UNEXPECTED_ERROR
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  email_not_confirmed: 'Confirm your email address before signing in.',
  invalid_credentials: 'The email or password is incorrect.',
  over_email_send_rate_limit: 'Too many email requests. Wait a few minutes and try again.',
  over_request_rate_limit: 'Too many attempts. Wait a few minutes and try again.',
  signup_disabled: 'Account creation is disabled. Contact the workshop owner for access.',
  user_already_exists: 'An account could not be created with those details. Try signing in instead.',
  weak_password: 'Choose a stronger password and try again.',
}

export function getAuthErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const message = AUTH_ERROR_MESSAGES[String(error.code)]
    if (message) return message
  }
  return getUserMessage(error)
}
