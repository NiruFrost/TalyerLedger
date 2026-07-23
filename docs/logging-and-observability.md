# TalyerLedger — Logging and Observability

## Logger

Implemented in `src/lib/logging/logger.ts`.

A structured JSON logger that writes to `console` with consistent format:

```json
{"timestamp":"2026-07-23T12:34:56.789Z","level":"info","event":"user_signed_in"}
```

## Log Levels

| Level | Method | Use Case |
|-------|--------|----------|
| `debug` | `logger.debug(event, context?)` | Development diagnostics only |
| `info` | `logger.info(event, context?)` | Normal operations (sign-in, record created) |
| `warn` | `logger.warn(event, context?)` | Recoverable issues, unexpected states |
| `error` | `logger.error(event, context?)` | Failures requiring attention |

## Event Naming Convention

Events are `snake_case` strings describing the action:

- `user_signed_in`, `user_signed_out`
- `customer_created`, `customer_updated`, `customer_deleted`
- `work_order_created`, `work_order_status_changed`
- `upload_failed`, `mutation_failed`
- `route_error`

## Privacy-Safe Redaction

The logger automatically redacts values whose keys match this regex:

```typescript
/address|authorization|cookie|email|id.?image|notes|password|phone|secret|token|vin|plate|claim|policy|storage.?path|signed.?url|reference|tax.?id/i
```

Redacted values are replaced with `[REDACTED]`.

## Never Log

- Passwords or password hashes
- Access tokens (Supabase tokens, session tokens)
- Service keys (service_role keys, API keys)
- ID documents or government ID numbers
- Private file URLs or signed URLs
- Full addresses or phone numbers
- Sensitive private notes
- Financial instrument numbers

## Usage Example

```typescript
import { logger } from '@/lib/logging/logger'

logger.info('customer_created', { customerId: newCustomer.id })
logger.error('upload_failed', { parentType, parentId, category, error: error.message })
```

## Current Usage

| File | Events |
|------|--------|
| `src/lib/query/query-client.ts` | `mutation_failed` |
| `src/app/error.tsx` | `route_error` |
| `src/app/api/attachments/upload/route.ts` | Upload failures |
| `src/features/attachments/components/attachment-upload.tsx` | `upload_failed` |
| `src/app/auth/callback/route.ts` | Auth warnings |

## Observability Gaps

- No log sink or retention beyond browser console
- No remote log aggregation (planned for when multi-user support arrives)
- No performance/telemetry instrumentation
- No log-level configuration at runtime
