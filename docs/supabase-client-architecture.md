# TalyerLedger — Supabase Client Architecture

## Client Types

The project uses four distinct Supabase client factories, each scoped to a specific runtime context.

| Client | File | Runtime | Key | Purpose |
|---|---|---|---|---|
| Browser client | `src/lib/supabase/client.ts` | Browser | `anon` | React components, hooks, client fetches |
| Server client | `src/lib/supabase/server.ts` | Server component | `anon` | Server-rendered data, layout auth checks |
| Middleware client | `src/lib/supabase/middleware.ts` | Edge | `anon` | Session refresh, auth redirects |
| Admin client | `src/lib/supabase/admin.ts` | Server only | `service_role` | Privileged ops (e.g. storage upload in API route) |

## Rules

1. **Never expose `service_role` client-side.** The admin client uses `import 'server-only'` at the module top.
2. **Always use validated env vars**, not raw `process.env.X`. All clients import from `@/lib/env` or `@/lib/env.server`.
3. **Browser client uses `createBrowserClient`** from `@supabase/ssr` for cookie-based session management.
4. **Server client uses `createServerClient`** with async cookie access via `next/headers`.
5. **Middleware client creates the Supabase client inside `updateSession()`**, copying cookies from the `NextRequest` and writing refreshed cookies to the `NextResponse`.
6. **Admin client disables `autoRefreshToken` and `persistSession`** since it is used for server-to-server operations, not user sessions.

## Where Each Client Is Used

```
Browser client (src/lib/supabase/client.ts)
  └─ createClient()
      └─ src/features/*/actions.ts    (feature actions)
      └─ src/features/*/hooks/*.ts    (via actions)

Server client (src/lib/supabase/server.ts)
  └─ createServerSupabaseClient()
      └─ src/app/(dashboard)/layout.tsx    (dashboard auth check)

Middleware client (src/lib/supabase/middleware.ts)
  └─ updateSession()
      └─ src/proxy.ts                     (Next.js 16 proxy)

Admin client (src/lib/supabase/admin.ts)
  └─ createAdminSupabaseClient()
      └─ src/app/api/attachments/upload/route.ts   (file upload endpoint)
```

## Authentication Cookie Flow

```
1. User signs in → Supabase sets HTTP-only cookies via Browser client
2. Every Next.js request → src/proxy.ts → updateSession()
   ├─ Reads cookies from request
   ├─ Creates middleware client → calls supabase.auth.getUser()
   ├─ No user + not public route → redirect to /login
   ├─ Has user + on /login or /register → redirect to /
   └─ Refreshes session cookies on response
3. Dashboard layout → createServerSupabaseClient()
   └─ Server-side auth check (second enforcement layer)
4. Client navigation → Browser client reads cookies automatically
```

## Access Token and Session Handling

- **Session refresh**: Handled by `updateSession` middleware. The `@supabase/ssr` library automatically refreshes tokens.
- **No session polling**: `refetchOnWindowFocus: false` in QueryClient config. Auth events handled by Supabase.
- **Token expiry**: Middleware redirects to `/login` when session is expired or invalid.
