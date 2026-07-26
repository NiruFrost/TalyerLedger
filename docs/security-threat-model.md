# Security Threat Model

## Status

This is a repository-level threat model for the current Next.js, Supabase, and private-attachment design. It records implemented controls and residual risks. It does not certify a live deployment, hosted RLS, backup configuration, restore capability, browser behavior, or production monitoring.

The primary authorization design is in `src/db/migrations/00009_phase0_tenant_security.sql`. That migration passed nine repository PGlite cases on 2026-07-26 but was not verified against a hosted Supabase project during this review.

## Assets

| Asset                   | Examples and paths                                                                              | Security need                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Authentication material | Supabase session cookies, auth codes, anon key, `SUPABASE_SERVICE_ROLE_KEY`                     | Confidentiality, integrity, revocation              |
| Workshop ownership      | `workshops`, `workshop_members`, `workshop_id` on business rows                                 | Strong tenant isolation and role integrity          |
| Customer PII            | Names, email, phone, address, notes in `customers`                                              | Confidentiality, correction, retention              |
| Vehicle identifiers     | VIN, plate, make/model, cover photo, service history                                            | Confidentiality and integrity                       |
| Work-order records      | Estimates, internal notes, insurance policy/claim data, representative identity, status history | Confidentiality, integrity, non-reuse of references |
| Financial records       | Line prices, discounts, payments, reference numbers, balances                                   | Integrity, traceability, availability               |
| Digital evidence        | Repair photos, authorization letters, captions, original filenames, signed URLs                 | Confidentiality, integrity, retention               |
| Business identity       | Shop address/contact, TIN, DTI/BN, business permit, logo                                        | Confidentiality and integrity                       |
| Audit evidence          | `created_by`, `updated_by`, `activity_logs`, status transitions                                 | Integrity and useful attribution                    |
| Availability data       | PostgreSQL records, Storage object bytes, configuration, migrations                             | Recoverability and continuity                       |
| Generated documents     | PDFs and filenames containing estimate number, plate, customer last name, and vehicle model     | Confidentiality and output correctness              |

## Actors

| Actor                         | Intended capability                                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Anonymous visitor             | Reach `/login` and `/auth/callback`; reach `/register` only when explicitly enabled                         |
| Authenticated workshop member | Read and modify active operational data in the member's current workshop under RLS                          |
| Workshop owner                | Member capabilities plus workshop/settings/membership administration allowed by policy                      |
| Next.js server                | Refresh sessions, enforce route access, process uploads, render routes                                      |
| `service_role` client         | Upload normalized attachment bytes after request-level authorization; bypasses RLS and is highly privileged |
| Operator                      | Configure Supabase Auth, secrets, database migrations, backups, deployment, and incident response           |
| Attacker                      | May be anonymous, a compromised member, a malicious member, or a party with leaked credentials/URLs         |

## Trust boundaries

| Boundary                           | Data crossing it                                                       | Existing controls                                                                                           | Important assumptions                                                                  |
| ---------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Browser to Next.js                 | Cookies, auth callback, route requests, upload forms                   | `src/proxy.ts`, `auth.getUser()`, dashboard server-layout check, origin check on upload, production headers | HTTPS and correct canonical origin are configured by the host                          |
| Browser to Supabase                | JWT-authenticated PostgREST, Auth, RPC, and signed-URL requests        | Anon key plus user JWT; forced workshop RLS in migration `00009`                                            | Hosted schema and grants match the repository migration                                |
| Next.js upload route to Supabase   | User-authorized parent lookup, workshop ID, service-role object upload | `server-only` admin client, parent lookup under user RLS, path prefixing, server image decoding             | Service key is present only in server runtime and the route runs in a Node environment |
| Database row to related row        | Customer, vehicle, work order, child, package, attachment parent IDs   | Composite workshop foreign keys; polymorphic parent trigger                                                 | Every new relationship receives equivalent tenant integrity                            |
| Database metadata to Storage bytes | `storage_path`, thumbnail path, object key                             | Private bucket and workshop-prefixed Storage SELECT policy                                                  | Object key and metadata remain consistent; no transaction spans DB and Storage         |
| Application to operator logs       | Error events and context                                               | Structured JSON logger with key-based recursive redaction                                                   | Platform log retention and access are configured externally                            |
| Build/CI to production             | Source, lockfile, public environment, secrets                          | GitHub Actions validation, Dependabot, `npm audit` at high severity                                         | Deployment uses the reviewed commit and does not expose secrets at build time          |

## STRIDE analysis

| Category               | Threat                                                               | Repository controls                                                                                                                                             | Residual risk and required verification                                                                                                                                                                                   |
| ---------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spoofing               | Stolen password or session impersonates a member                     | Supabase Auth; server and proxy call `auth.getUser()` rather than trusting local claims                                                                         | No application MFA, session-revocation runbook, or Supabase password-policy evidence is present. Verify provider settings and cookie behavior live.                                                                       |
| Spoofing               | Unsafe auth return URL redirects a user off-site                     | `sanitizeReturnPath()` rejects absolute, protocol-relative, backslash, control-character, auth-entry, and callback paths; unit tests cover representative cases | Callback and proxy behavior still need browser tests behind the production proxy/CDN.                                                                                                                                     |
| Spoofing               | Public signup creates unauthorized accounts                          | `NEXT_PUBLIC_ALLOW_SIGN_UP` defaults false in UI/action routing                                                                                                 | This flag does not disable Supabase Auth's public signup endpoint. Disable signup in Supabase unless isolated self-registration is intended. New users are provisioned into separate workshops, not an existing workshop. |
| Tampering              | A member supplies another workshop ID or parent ID                   | Forced RLS, immutable workshop trigger, composite foreign keys, attachment parent trigger                                                                       | Hosted RLS is unverified. Legacy `photos` parents do not have the same composite tenant constraints.                                                                                                                      |
| Tampering              | A member changes protected financial or status data                  | Financial checks/total trigger, derived-payment guard, status/number trigger, and expected-version atomic RPC                                                     | Most workshop members still have broad business-row update rights. Privileged roles can bypass these controls and require separate operational governance.                                                               |
| Tampering              | Malicious or malformed upload reaches private storage                | Client/raw and server/processed size checks, rate limit, 40 MP limit, Sharp decode/format check, rotation, resize, JPEG re-encoding, non-upsert upload            | No malware scan, distributed rate limiter, per-workshop quota, aggregate file-count limit, or load test. Multipart parsing remains subject to host request limits.                                                        |
| Tampering              | Metadata points at an object or parent it should not                 | Parent checked under user RLS; metadata trigger binds active same-workshop parent and exact path; unique path indexes prevent aliases                            | Upload and metadata insert are not atomic. Failed metadata writes can leave orphaned objects; soft delete intentionally retains bytes.                                                                                    |
| Repudiation            | A user denies changing a record                                      | Audit triggers populate actor fields; status changes insert `activity_logs`; logs include timestamp/event                                                       | Not every operation creates an activity event. `activity_logs` are append-only to normal clients but privileged roles can alter them. There is no immutable external audit sink or correlation ID standard.               |
| Information disclosure | Cross-workshop rows are read by guessed UUID                         | Workshop RLS and active-row filters; representative PGlite isolation tests                                                                                      | Only selected tables are behavior-tested; live JWT/grant behavior is unverified. A user with several memberships can read all member workshops.                                                                           |
| Information disclosure | Attachment bytes leak across workshops                               | Private bucket, exact metadata-path policy, active parent checks, workshop prefix, signed URLs, owner-only private visibility                                   | `workshop` and `customer` classifications are both member-readable; no public customer role exists. Issued URLs remain bearer links for 1, 2, or 24 hours depending on flow.                                              |
| Information disclosure | Legacy media remains public                                          | Migration `00009` drops legacy object policies                                                                                                                  | It does not remove or privatize an existing `photos` bucket. Inspect live bucket configuration and old public URLs.                                                                                                       |
| Information disclosure | XSS or framing exposes records                                       | React text escaping, CSP, `frame-ancestors 'none'`, `X-Frame-Options: DENY`, MIME sniffing prevention, strict referrer policy                                   | CSP permits inline scripts/styles and trusts all `*.supabase.co` endpoints. No nonce/reporting endpoint is configured. Verify headers at the deployed edge.                                                               |
| Information disclosure | Logs contain PII, secrets, URLs, or raw errors                       | Structured logger plus bounded call sites; upload errors log only an event and error class                                                                      | Redaction is key-name based and incomplete. No sink/access/retention configuration is in the repository.                                                                                                                  |
| Information disclosure | PDF or downloaded filename leaks identity                            | Customer-safe attachment query filters `visibility = 'customer'`; PDF attachment reads are capped at 30                                                         | The filter is application-only, not a separate customer authorization policy. Filenames include plate and customer last name. Generated PDFs are not stored or access-audited by current code.                            |
| Denial of service      | Search/list/PDF work consumes browser, database, or server resources | Search waits for two characters and limits each group to five; several lists cap at 100; PDF route is dynamically imported; image dimensions are bounded        | Vehicle, labor, payment, line-item, and normal attachment reads are unbounded. No request rate limits, timeouts, cancellation, quotas, or measured capacity baseline exist.                                               |
| Denial of service      | Repeated image uploads exhaust CPU or storage                        | 10 MiB raw client limit, 4 MiB processed request limit, per-user in-process rate limit, 40 MP decode limit, bounded resize                                       | Two objects are created per image and retained after soft delete. In-memory rate limits do not coordinate across instances; no purge automation or measured capacity baseline exists.                                   |
| Elevation of privilege | Service-role key reaches a client or is used before authorization    | `src/lib/supabase/admin.ts` imports `server-only`; only upload route currently creates the admin client; public schema excludes the key                         | Any leak gives broad Supabase access. There is no key-rotation runbook or automated secret scan shown. Preview environments must not receive production service keys.                                                     |
| Elevation of privilege | A normal member performs owner-sensitive work                        | Settings/workshop/member policies require owner                                                                                                                 | Most business rows, including PII, internal notes, payments, and attachments, do not distinguish member from owner. Define finer roles before adding less-trusted staff or customers.                                     |
| Elevation of privilege | Dependency or CI compromise alters a build                           | Lockfile, weekly npm Dependabot, monthly Actions Dependabot, read-only CI contents permission, production dependency audit                                      | No artifact signing, provenance verification, deploy workflow, or secret scanning is configured in this repository.                                                                                                       |

## Control inventory

| Control                          | Location                                                                           | What it establishes                                                                | Verification state                                                  |
| -------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Session refresh and route gate   | `src/proxy.ts`, `src/lib/supabase/middleware.ts`, `src/app/(dashboard)/layout.tsx` | Unauthenticated users are redirected; authenticated users leave auth-entry routes  | Route sanitizer unit-tested; anonymous protected redirect browser-tested |
| Tenant RLS and integrity         | `src/db/migrations/00009_phase0_tenant_security.sql`                               | Workshop scope, policies, forced RLS, composite keys, helper RPCs                  | Clean PGlite chain and selected behavior pass; hosted state unknown |
| Private media upload             | `src/app/api/attachments/upload/route.ts`                                          | Exact-origin, authenticated, parent-authorized, normalized JPEG upload             | Build-verified only; no route/Storage integration test              |
| Public/private environment split | `src/lib/env.ts`, `src/lib/env.server.ts`, `.env.example`                          | Public variables are validated; service key is server-only and optional at build   | Unit tests cover public parsing; deployment values unknown          |
| Security headers                 | `next.config.ts`                                                                   | CSP, referrer policy, frame denial, `nosniff`, permissions policy, production HSTS | Compiles; edge response not inspected                               |
| Input constraints                | Feature schemas and migration CHECK constraints                                    | Bounds and validates common form/financial data                                    | Partial unit tests; not every feature is covered                    |
| Structured logging               | `src/lib/logging/logger.ts`                                                        | JSON events and recursive key-based redaction                                      | No redaction tests or production sink evidence                      |
| Dependency checks                | `.github/workflows/ci.yml`, `.github/dependabot.yml`                               | Lint, typecheck, Vitest, build, high production audit, update cadence              | Workflow exists; current remote run status not inspected            |

## Logging and redaction

### Current behavior

`src/lib/logging/logger.ts` writes one JSON object to `console` with `timestamp`, `level`, `event`, and context. It recursively replaces values when a key matches:

```text
address | authorization | cookie | email | id.?image | notes |
password | phone | secret | token
```

Current call sites log bounded event names, error names/codes, route digests, and mutation keys. Attachment upload failures do not log raw errors, filenames, paths, or captions.

### Required rules

Never log these values, even under a differently named key:

- Passwords, auth codes, JWTs, session cookies, refresh tokens, anon/service keys, signed URLs, or URL query strings.
- Customer name, email, phone, address, notes, or internal notes.
- VIN, plate, insurance company/policy/claim number, representative name/ID, payment reference, tax identifiers, or permits.
- Attachment bytes, thumbnails, captions, original filenames, storage paths, EXIF, or request bodies.
- Raw Supabase responses, full `Error` objects, form payloads, database rows, or PDF data.

Prefer these bounded fields:

- Stable event code, severity, UTC timestamp, route template, HTTP status class, operation name, error class/code, retry count, and coarse duration bucket.
- A random request/correlation ID that has no business meaning.
- Opaque row/workshop/user identifiers only when incident response requires them, with restricted access and documented retention. Hashing a low-entropy identifier is not anonymization.

### Redaction gaps

The current regular expression does not automatically redact keys such as `name`, `message`, `caption`, `filename`, `storagePath`, `signedUrl`, `vin`, `plate`, `claim`, `policy`, `reference`, `taxId`, `metadata`, or `userId`. It also does not inspect sensitive text embedded in a string. Callers must avoid those values rather than relying solely on the logger.

Before production, add redaction unit tests, remove raw console calls, define log access and retention, and verify that the hosting platform does not capture request bodies or sensitive headers by default.

## Residual-risk priorities

| Priority | Risk                                                                                          | Exit criterion                                                                                                                                 |
| -------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | Hosted migration/RLS/storage state is unknown                                                 | Apply through `00009` in staging, inspect catalog/grants, and run two-user live policy tests from [rls-policy-matrix.md](rls-policy-matrix.md) |
| P0       | No complete backup and restore evidence, especially Storage bytes and Auth coupling           | Implement and complete an isolated restore drill described in [backup-recovery.md](backup-recovery.md)                                         |
| P0       | Public signup can differ between app flag and Supabase Auth setting                           | Disable provider signup or document and test intentional isolated provisioning                                                                 |
| P1       | Legacy bucket state and customer-facing authorization remain unknown                          | Audit/remove or privatize the legacy bucket; design a separate customer role/token before any public sharing                                   |
| P1       | Service-role upload has no hosted integration or capacity test                                | Test route against staging Storage and replace/augment the in-memory limiter with host/WAF quotas and alerts                                   |
| P1       | Broad member role exposes all workshop business data                                          | Define role permissions before onboarding less-trusted users                                                                                   |
| P1       | Logging redaction is incomplete and no operational sink policy exists                         | Add tests, remove bypasses, and approve access/retention rules                                                                                 |
| P2       | Browser security headers, accessibility, and signed-URL lifetimes are not end-to-end verified | Add Playwright/security checks and inspect deployed responses                                                                                  |

Review this model whenever a migration adds a table or policy, an attachment parent/type is added, signup/membership changes, a new privileged route appears, a third-party integration is introduced, or logging/backup infrastructure changes.
