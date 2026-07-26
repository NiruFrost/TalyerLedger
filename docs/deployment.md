# Deployment

## Current deployment posture

TalyerLedger is a Next.js 16 Node application backed by Supabase Auth, PostgreSQL/PostgREST, RPCs, and Storage. Application data is not stored on the web host.

The repository has no Vercel configuration, Dockerfile, container/orchestrator manifest, infrastructure-as-code, release workflow, health endpoint, Supabase `config.toml`, standard `supabase/migrations` directory, or remote migration ledger. `.github/workflows/ci.yml` validates source but does not deploy it.

No live application, Supabase project, browser, RLS, Storage upload, latency, backup, or restore was verified while writing this guide. A local production build succeeded only after valid process-only CI placeholders were supplied; the existing local `NEXT_PUBLIC_SITE_URL` value failed validation and remains a local configuration blocker until corrected.

## Runtime requirements

| Requirement             | Repository evidence                                                            | Deployment implication                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Node                    | `.nvmrc` is 22; package engine is `>=22 <25`; CI uses 22                       | Deploy on Node 22 unless a separate qualification approves another supported version            |
| Build/start             | `npm run build` uses `next build --webpack`; `npm run start` uses `next start` | Host must support a Next.js Node server, not static export                                      |
| Native image processing | `sharp` in `src/app/api/attachments/upload/route.ts`                           | Use a Node runtime with compatible native package support, memory, CPU, body size, and duration |
| Dynamic application     | Dashboard layout is `force-dynamic`; build marks most routes dynamic           | CDN-only static hosting is insufficient                                                         |
| Supabase browser access | Browser client uses public URL/anon key directly                               | CSP/network/firewall must permit HTTPS/WSS to the intended Supabase host                        |
| Server secret           | Service role is required at runtime for attachment uploads                     | Secret must exist only in server runtime; previews must not receive production credentials      |
| Canonical origin        | Upload route compares `Origin` exactly to `NEXT_PUBLIC_SITE_URL`               | Each deployed environment needs its exact external origin, including scheme/host/port           |

The browser accepts raw sources up to 10 MiB and 40 megapixels, then optimizes them. The server route accepts the processed multipart request only up to 4 MiB (plus bounded header overhead), leaving headroom below the selected host's function payload limit.

## Environments

Maintain separate Supabase projects and secrets for local/test, staging, and production. Do not point preview deployments at production data.

| Environment | Purpose                                                                       | Minimum isolation                                                                                   |
| ----------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Local/test  | Unit, PGlite, UI development                                                  | Placeholder public values for offline tests; dedicated non-production Supabase only for integration |
| Staging     | Migration rehearsal, live RLS/Storage, Playwright, performance, restore smoke | Separate Supabase project, synthetic data, separate service key and canonical URL                   |
| Production  | Workshop operations                                                           | Restricted operators, approved backup/recovery, monitored secrets and access                        |

Public `NEXT_PUBLIC_*` values are compiled into browser code. Supply them consistently at build and runtime and rebuild after changes.

## Environment variables

| Variable                                                                    | Required            | Scope              | Deployment rule                                                                                      |
| --------------------------------------------------------------------------- | ------------------- | ------------------ | ---------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                                                  | Yes                 | Browser and server | Exact environment project URL; update CSP if a custom non-`*.supabase.co` domain is used             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`                                             | Yes                 | Browser and server | Public by design; never substitute service role                                                      |
| `NEXT_PUBLIC_SITE_URL`                                                      | Yes                 | Browser and server | Exact canonical origin; HTTPS required for non-local production                                      |
| `NEXT_PUBLIC_ALLOW_SIGN_UP`                                                 | Defaults false      | Browser and server | Keep false until hosted provisioning is verified and provider signup policy intentionally agrees     |
| `SUPABASE_SERVICE_ROLE_KEY`                                                 | Required for upload | Server only        | Encrypted server runtime; never previews sharing production, logs, client bundles, or `NEXT_PUBLIC_` |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_ENDPOINT` | No                  | Server only        | Parsed but inactive; setting them does not change the current Supabase Storage adapter               |

See `docs/environment-variables.md` and `.env.example`. Also configure Supabase Auth's Site URL/redirect allowlist for the deployment, including the exact `/auth/callback` URL. The application flag does not disable direct signup at the provider, so configure Supabase Auth separately.

## Pre-deployment gates

### Source validation

Run under Node 22 from an immutable checkout:

```sh
npm ci
npm run lint -- --max-warnings=0
npm run typecheck
npm run test:run
npm audit --omit=dev --audit-level=high
npm run build
```

The current CI runs this sequence with public placeholders. It does not supply a service key or make a live upload. Run `npx playwright test` in a staging browser job after its environment and Chromium are prepared; this is not a current CI step.

### Data and migration preflight

1. Identify the exact target project and current application commit.
2. Stop writes/signup for a populated schema cutover.
3. Take and verify the matching database and object backup in [backup-recovery.md](backup-recovery.md).
4. Complete every drift, ownership, financial, and attachment-path check in `docs/migration-guide.md`.
5. Rehearse on a restored clone or staging project.
6. Do not apply repaired historical migrations blindly to a remote that may have run older copies.

Migration `00009` automatically maps existing operational data only when exactly one Auth user exists. It intentionally aborts on ambiguous multi-user data. Build a target-specific reviewed mapping instead of weakening that guard.

## Database deployment

The application expects the end state through `src/db/migrations/00009_phase0_tenant_security.sql`, including:

- `work_orders`, not the legacy `jobs` table.
- Workshop ownership, memberships, non-null tenant columns, forced RLS, and composite tenant integrity.
- Soft-delete/restore RPCs and `current_workshop_id()`.
- Atomic work-order numbering RPC and counters.
- Status-transition trigger and financial constraints.
- Private `attachments` bucket and workshop-prefixed object reads.

For a clean Supabase project, apply complete migrations `00001` through `00009` in numeric order with a controlled SQL runner or SQL editor and stop on the first error. For any existing or drifted project, use the scenarios in `docs/migration-guide.md`; there is no safe generic `db push` in this repository layout.

Record target, UTC time, operator, backup ID, migration file hashes, runner/version, output, and verification result. Do not log row payloads or credentials.

## Application deployment order

1. Create an immutable application artifact from the validated commit.
2. Configure environment-specific public values and server secrets.
3. Freeze writes and take the final backup if schema changes are included.
4. Apply/reconcile database and Storage changes in staging, then the approved production target.
5. Run live structural and two-user authorization checks before resuming writes.
6. Deploy the application artifact compatible with that schema.
7. Run edge, auth, CRUD, upload, PDF, accessibility smoke, and monitoring checks.
8. Resume traffic gradually and retain the prior artifact plus backup for the approved rollback window.

Application and schema should be treated as one release. Current code calls RPCs introduced by `00009`; deploying it first can break create/delete/upload. Rolling the app back after `00009` can also be unsafe because earlier code may expect broad policies, old storage paths, or different schema behavior.

## Post-deployment verification

### Edge and configuration

- Request `/login` through the public HTTPS hostname and verify status, content, and no redirect loop.
- Inspect response headers for CSP, `Referrer-Policy`, `X-Content-Type-Options`, frame denial, permissions policy, and production HSTS.
- Confirm browser bundles/network responses contain only the public anon key, never service role or R2 secrets.
- Verify the exact canonical origin can upload while a mismatched/absent Origin is rejected.
- Verify Supabase callback and redirect allowlists use the deployed origin.
- Verify signup is closed in both application and Supabase, unless intentional isolated provisioning is approved.

`next.config.ts` currently permits connections and images only under `*.supabase.co` plus same-origin allowances. A custom Supabase domain, R2 adapter, analytics, monitoring endpoint, or remote image host requires a reviewed CSP/configuration change before deployment.

### Database and authorization

Use read-only catalog queries from `docs/migration-guide.md` to confirm all expected tables, forced RLS, policy expressions, grants, functions, triggers, constraints, and private bucket settings.

Then use real anon/authenticated API clients, not the SQL editor's privileged session:

1. Anonymous requests return no operational rows.
2. User A can use its workshop; User B from another workshop cannot read or update User A's rows.
3. Cross-workshop parent IDs fail.
4. Soft delete hides an active row and restore returns it through the approved RPC.
5. Owner-only workshop/settings/membership operations reject a normal member.
6. Concurrent work-order allocation is unique and workshop-local.
7. Invalid status transitions fail and valid transitions write expected activity.

The PGlite suite is not a substitute for this check.

### Functional smoke

- Login, safe return path, logout, callback failure, protected redirect, and registration mode.
- Customer create/edit/read, vehicle create/edit/read, and relation integrity.
- Work-order create/copy, line items, discounts, payment recalculation, and allowed status transition.
- Search across customer, vehicle, and work order. Current search still queries `jobs` and is a known release blocker after the table rename until reconciled.
- Vehicle timeline. Current code selects `order_no`, while the schema exposes `estimate_no`; verify/fix before claiming it works.
- Attachment source validation, full and thumbnail upload, metadata insert, gallery signed read, cross-workshop denial, and soft delete.
- PDF preview/download with and without a customer-visible photo appendix.
- Mobile navigation, keyboard login, error state, reduced motion, and dark/light rendering.

The vehicle cover field currently mixes arbitrary URL and attachment-ID behavior, while `next/image` remote configuration is not defined. Include cover rendering in smoke or disable that workflow operationally until reconciled.

### Storage

- `attachments` is private, 10 MiB, and JPEG-only for stored outputs.
- New keys begin with the actual workshop UUID and approved parent type/ID.
- User A can create/display a signed URL; User B and anon cannot.
- Failed metadata insert does not go unnoticed as an orphan object.
- Any legacy `photos` bucket is inventoried and removed or private; migration `00009` does not do that automatically.

### Monitoring

The repository logger emits JSON to console, but no production log sink, alert, tracing, uptime check, or metrics configuration exists. Before production, define alerts for:

- Authentication/callback failure spikes.
- 401/403/429/5xx rates and upload failures.
- Database/storage errors, connection pressure, and slow queries.
- Backup failure and restore-drill age.
- Storage growth and orphan/retained object growth.
- Unexpected signup/user/workshop creation.

Follow the redaction policy in [security-threat-model.md](security-threat-model.md). Do not add record bodies, signed URLs, filenames, VIN/plate, customer data, or raw errors to make monitoring easier.

## Rollback

### Application-only release with no schema dependency

Redeploy the previous immutable artifact and its matching environment configuration, then repeat smoke checks. Preserve logs and the failed artifact for diagnosis.

### Failed migration before commit

Migration `00009` is transactional, so a SQL error should roll back its database statements. Confirm actual catalog state before retrying. External object copies/moves do not roll back with PostgreSQL and need reconciliation.

### Committed schema/security change

Keep writes stopped. Prefer a reviewed forward fix and preserve workshop ownership. Never restore the old global authenticated policies. If full rollback is safer, restore the complete verified database plus matching Storage objects and deploy the compatible prior application as one operation under [backup-recovery.md](backup-recovery.md).

Commented down-migration snippets are development guidance, not a production rollback plan. Several changes are lossy or security-sensitive.

## Platform-specific validation

Because no host is selected in the repository, verify these before choosing or approving one:

| Capability              | Required proof                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------- |
| Next.js 16 Node support | Successful immutable build and dynamic route/proxy execution                            |
| Sharp/native modules    | Real PNG/WebP/JPEG upload and normalized output                                         |
| Request body/timeout    | Processed multipart bodies up to 4 MiB are supported and oversized requests return 413   |
| Environment separation  | Build/runtime public values align; service key remains server-only                      |
| Preview safety          | Preview uses staging Supabase and a preview-specific exact site origin                  |
| Security headers        | Host/CDN preserves or deliberately supersedes Next headers                              |
| Rollback                | Previous artifact can be selected without rebuilding mutable source                     |
| Observability           | Logs/alerts meet redaction and retention requirements                                   |

## Residual blockers

- No deployment target or automated release pipeline is defined.
- The existing local `NEXT_PUBLIC_SITE_URL` is invalid; a default local build fails until environment configuration is corrected.
- Migration `00009`, hosted RLS, Auth provisioning, private bucket, and service-role upload are not live-verified.
- There is no complete backup/object export or restore drill.
- Playwright is not in CI and no authenticated browser flow has been run here.
- Global search references `jobs`, and the vehicle timeline references `order_no`, both inconsistent with the migrated schema.
- Private attachments are owner-only; workshop/customer classifications are member-readable. Legacy bucket state remains unknown.
- Host limits, production regions, browser metrics, and latency are unmeasured.
- No health check, production telemetry, alerting, or secret-rotation procedure is implemented in the repository.

Do not label a deployment production-ready until these blockers are resolved or explicitly risk-accepted by the responsible owner with a time-bounded remediation plan.
