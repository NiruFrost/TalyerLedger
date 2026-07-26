# Environment Variables

## Loading and validation

Browser-safe settings are validated at module load by `src/lib/env.ts`. Server secrets are isolated with `server-only` and validated by `src/lib/env.server.ts`.

Use `.env.example` as the name/value template and keep local values in `.env.local`, which is ignored by Git. Never put real secrets in documentation, source files, committed examples, or `NEXT_PUBLIC_` variables.

## Application variables

| Variable                        | Exposure           | Required                        | Validation/default                                                                         | Used by                                                                               |
| ------------------------------- | ------------------ | ------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Browser and server | Yes                             | Valid absolute URL                                                                         | Browser/server/admin Supabase clients.                                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and server | Yes                             | Non-empty string                                                                           | Browser and cookie-aware server clients. This is public by design; RLS protects data. |
| `NEXT_PUBLIC_SITE_URL`          | Browser and server | Yes                             | Valid URL; production non-local URLs must use HTTPS                                        | Trusted-origin comparison for uploads and application URL behavior.                   |
| `NEXT_PUBLIC_ALLOW_SIGN_UP`     | Browser and server | No                              | `true` or `false`; defaults to `false`                                                     | Public-route classification, registration UI, and `signUp()` guard.                   |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server only        | Required for attachment uploads | Optional at general process validation, but `createAdminSupabaseClient()` throws if absent | Server-side write to the private `attachments` bucket.                                |

### Required baseline

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ALLOW_SIGN_UP=false
```

### Secure attachment upload

```env
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
```

`SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. It must be configured only in the server runtime, such as encrypted Vercel environment settings or an uncommitted local environment file. It must never be prefixed with `NEXT_PUBLIC_`, returned from an API, logged, or passed into a Client Component.

The upload route first authorizes the user and parent through the cookie-aware user client, then uses the admin client only for the storage write. Removing the service-role key disables secure uploads but does not affect ordinary browser CRUD that uses the anon key and user JWT.

## Inactive R2 adapter variables

| Variable               | Exposure    | Current status                                         | Validation                 |
| ---------------------- | ----------- | ------------------------------------------------------ | -------------------------- |
| `R2_ACCESS_KEY_ID`     | Server only | Parsed but no active R2 adapter consumes it.           | Optional non-empty string. |
| `R2_SECRET_ACCESS_KEY` | Server only | Parsed but inactive.                                   | Optional non-empty string. |
| `R2_BUCKET_NAME`       | Server only | Parsed but inactive; example value is `talyer-ledger`. | Optional non-empty string. |
| `R2_ENDPOINT`          | Server only | Parsed but inactive.                                   | Optional URL.              |

Setting these variables does not move uploads to Cloudflare R2. The current `StorageService` uses the Next.js upload route and Supabase Storage.

## Framework and CI variables

| Variable   | Managed by      | Effect                                                                                                                                        |
| ---------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV` | Next.js/runtime | Enables production HTTPS validation and production-only security headers such as HSTS. Do not set it inconsistently with the runtime command. |
| `CI`       | CI provider     | Enables Playwright retries/GitHub reporter and prevents reuse of a local dev server.                                                          |

These are runtime controls, not values that normally belong in `.env.example`.

## Environment behavior

### Local development

- Use `NEXT_PUBLIC_SITE_URL=http://localhost:3000` when opening that exact origin.
- If using `http://127.0.0.1:3000`, set the site URL to that origin instead; the upload route compares origins exactly.
- Configure a real service-role key only when testing the secure upload route against an authorized Supabase project.
- Keep sign-up false unless migration `00009` and its `handle_new_auth_user()` trigger are present on the target database.

### Automated tests

`vitest.setup.ts` supplies non-secret placeholders when values are absent:

```text
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ALLOW_SIGN_UP=false
```

The PGlite migration test does not connect to the URL. The GitHub Actions workflow sets its own placeholder public values for lint, typecheck, tests, and build. It does not exercise a live secure upload.

### Production

- Use the exact externally visible HTTPS origin for `NEXT_PUBLIC_SITE_URL`, with no alternate hostname assumption.
- Configure public values for build and runtime because Next.js embeds `NEXT_PUBLIC_` references in browser bundles.
- Configure `SUPABASE_SERVICE_ROLE_KEY` only for server execution.
- Leave sign-up disabled until the live database has been preflighted and migration `00009` is confirmed applied.
- Rotate the service-role key immediately if it is exposed; changing RLS is not sufficient because the key bypasses RLS.

## Sign-up dependency

Enabling `NEXT_PUBLIC_ALLOW_SIGN_UP` changes both routing and account creation. A successful auth-user insert is expected to trigger database provisioning of:

1. One `workshops` row owned by the new user.
2. One active `workshop_members` owner row.
3. One `shop_settings` row.

Do not enable sign-up against a schema earlier than `00009`; the account could exist without the tenant records required by current RLS.

## Troubleshooting

| Error                                                                 | Likely cause                                                              | Check                                                                                           |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `Invalid public environment variables: ...`                           | Missing/malformed public value                                            | Compare names with `.env.example`; ensure URLs include scheme.                                  |
| `NEXT_PUBLIC_SITE_URL must use HTTPS in production`                   | Non-local production HTTP URL                                             | Use the deployed HTTPS origin.                                                                  |
| `SUPABASE_SERVICE_ROLE_KEY is required for secure attachment uploads` | Upload route reached without server secret                                | Configure the key in the server runtime, then restart/redeploy.                                 |
| Upload returns `Request origin is not allowed.`                       | Browser origin differs from `NEXT_PUBLIC_SITE_URL`, or `Origin` is absent | Match protocol, host, and port exactly.                                                         |
| Sign-up route redirects to login                                      | Sign-up flag missing or false                                             | Set to `true` only after tenant-provisioning migration verification.                            |
| Browser can authenticate but sees no rows                             | Missing active membership or `00009` mapping issue                        | Inspect workshop/membership records and RLS; do not solve by using service role in the browser. |

## Verification

Environment parsing is covered by `src/lib/env.test.ts`, including the default-closed sign-up flag, actionable missing-field errors, and production HTTPS enforcement. After changing environment settings, restart the development process or redeploy so module-level validation and embedded public values are refreshed.
