type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const REDACTED_KEYS = /address|authorization|cookie|email|id.?image|notes|password|phone|secret|token|vin|plate|claim|policy|storage.?path|signed.?url|reference|tax.?id/i

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      REDACTED_KEYS.test(key) ? '[REDACTED]' : redact(entry),
    ]),
  )
}

function write(level: LogLevel, event: string, context: Record<string, unknown> = {}) {
  const safeContext = redact(context) as Record<string, unknown>
  const record = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...safeContext,
  }

  const method = level === 'debug' ? 'debug' : level === 'info' ? 'info' : level
  console[method](JSON.stringify(record))
}

export const logger = {
  debug: (event: string, context?: Record<string, unknown>) => write('debug', event, context),
  info: (event: string, context?: Record<string, unknown>) => write('info', event, context),
  warn: (event: string, context?: Record<string, unknown>) => write('warn', event, context),
  error: (event: string, context?: Record<string, unknown>) => write('error', event, context),
}
