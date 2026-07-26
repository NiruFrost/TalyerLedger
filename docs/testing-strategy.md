# Testing Strategy

## Goals

Tests protect financial correctness, tenant isolation, data migration, accessible interaction, route security, and critical workshop flows. No single test layer proves all of these. In particular, PGlite is not hosted Supabase and jsdom is not a browser.

## Current toolchain

| Tool            | Configuration/path                                                   | Current purpose                                                                                             |
| --------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Vitest          | `vitest.config.ts`, `vitest.setup.ts`                                | Unit, repository, component, environment, and PGlite tests                                                  |
| PGlite          | `src/db/tests/migrations.test.ts`                                    | Execute the complete SQL chain in an in-memory PostgreSQL-compatible engine and exercise representative RLS |
| Testing Library | Component tests such as `src/components/shared/error-state.test.tsx` | Query by semantics and exercise user interaction                                                            |
| user-event      | `error-state.test.tsx`                                               | Browser-like pointer/keyboard interaction in jsdom                                                          |
| vitest-axe      | `error-state.test.tsx`                                               | Automated semantic axe rules for one rendered component                                                     |
| Playwright      | `playwright.config.ts`, `e2e/auth-foundation.spec.ts`                | Desktop Chromium and Pixel 7-emulated browser smoke                                                         |
| GitHub Actions  | `.github/workflows/ci.yml`                                           | Lint, typecheck, Vitest, production dependency audit, build on Node 22                                      |

Vitest defaults to the Node environment. A DOM test must opt in with `// @vitest-environment jsdom` or an equivalent configured pattern. `vitest.setup.ts` installs jest-dom matchers and safe public environment placeholders.

## Current evidence

Run on 2026-07-26:

| Command                                           | Result                       |
| ------------------------------------------------- | ---------------------------- |
| `npm run test:run`                                | 9 files, 50 tests passed     |
| `npm run lint`                                    | Passed with zero warnings    |
| `npm run typecheck`                               | Passed                       |
| `npm run build` with process-only CI placeholders | Passed under Next.js 16.2.11 |
| `npx playwright test`                             | 2 projects passed            |

The 50 Vitest assertions comprise 23 financial calculation tests, 9 PGlite migration/RLS cases, 7 auth-route cases, 3 environment tests, 3 safe-error mapping tests, 2 customer-schema tests, 1 customer-repository test, 1 rate-limit test, and 1 component accessibility/interaction test.

Playwright passed desktop Chromium and Pixel 7-emulated anonymous auth/route smoke. No live Supabase, hosted Storage, service-role upload, production browser, backup, restore, or latency test was performed.

## Commands

### Fast development loop

```sh
npm test
```

`npm test` starts Vitest in watch mode. Run one file directly when iterating:

```sh
npx vitest src/lib/financial-calculations.test.ts
npx vitest src/components/shared/error-state.test.tsx
```

### Deterministic local/CI validation

```sh
npm ci
npm run lint
npm run typecheck
npm run test:run
npm audit --omit=dev --audit-level=high
npm run build
```

These match `.github/workflows/ci.yml`, which also installs Chromium and runs Playwright without suppressing failures. Public build placeholders in CI are not credentials and do not test networked Supabase behavior.

### Database migration suite

```sh
npm run db:test
```

This runs `vitest run src/db/tests`. It is also included in `npm run test:run`, so running both in one sequence repeats the migration suite.

### Coverage

```sh
npm run test:coverage
```

Coverage uses V8 and emits text, JSON summary, and HTML for `src/**/*.{ts,tsx}`. There are no configured global or per-file thresholds. A coverage percentage is therefore diagnostic, not a release guarantee.

### Browser tests

```sh
npx playwright install chromium
npx playwright test
```

Useful focused runs:

```sh
npx playwright test e2e/auth-foundation.spec.ts --project=chromium
npx playwright test e2e/auth-foundation.spec.ts --project=mobile-chromium
npx playwright test --ui
```

There is no `test:e2e` package script and Playwright is not a CI step. The local config starts `npm run dev`, uses `http://127.0.0.1:3000`, reuses an existing server outside CI, retries twice in CI, and records traces on the first retry. Ensure `NEXT_PUBLIC_SITE_URL` uses the same origin when an upload test is added.

## Layer responsibilities

### Unit tests

Use for deterministic, side-effect-free domain behavior:

- Currency rounding, discounts, totals, payment state, and persistence-token mapping.
- Zod normalization, bounds, conditional fields, and error messages.
- Safe return paths, environment parsing, filename/path normalization, and log redaction.
- Status-transition maps and presentation helpers, while keeping the database trigger covered separately.

Financial edge cases must include half-cent rounding, zero, invalid numbers, overpayment, maximum percent, amount greater than subtotal, and non-mutation of inputs.

### Repository/action tests

Use an injected or mocked Supabase client to assert query shape and application orchestration:

- Correct table name, selected columns, active-row relation filters, ordering, and explicit limits.
- Mutation invalidation and safe error mapping.
- Soft-delete/restore RPC names and argument allowlists.
- Multi-call failure behavior for line-item/payment recalculation, package replacement, and object/metadata creation.

Do not use a query mock as proof that RLS authorizes the query.

### Component tests

Use Testing Library semantic queries. Cover:

- Accessible name, role, description, invalid state, focus movement, keyboard operation, and pending/error feedback.
- Empty, loading, error, offline, disabled, and success states.
- Dialog open/close, Escape, focus return, destructive confirmation, and live-region behavior.
- Forms with realistic `userEvent` input rather than calling component handlers directly.

Avoid snapshots as the only assertion. Prefer behavior and user-visible semantics.

### Automated accessibility

Use `vitest-axe` for stable component markup and browser axe for screens. The current ErrorState test disables `color-contrast`, which is appropriate for jsdom's lack of layout but means contrast remains completely manual/browser-measured.

Automated axe does not prove keyboard order, screen-reader output, reflow, target size, PDF accessibility, or usability. Complete [accessibility-checklist.md](accessibility-checklist.md) for screen review.

### PGlite migration tests

`src/db/tests/migrations.test.ts`:

1. Creates test `anon`, `authenticated`, and BYPASSRLS `service_role` roles.
2. Stubs minimal `auth.users`, `auth.uid()`, `auth.role()`, `storage.buckets`, `storage.objects`, and `storage.foldername()` behavior.
3. Reads every `.sql` file under `src/db/migrations`, sorts filenames, and executes the full chain.
4. Creates two auth users after migration `00009`, exercising its provisioning trigger.
5. Tests customer isolation/soft delete, anonymous denial, a cross-workshop vehicle FK attempt, attachment metadata isolation, Storage object isolation, and private bucket size.

PGlite proves clean-chain SQL compatibility with its PostgreSQL subset and these representative policies. It does not prove:

- A drifted, partial, or differently repaired remote migration history.
- Supabase PostgREST grants, JWT claims, Auth hooks, Storage API signed URLs, or managed schema details.
- The one-user legacy backfill, ambiguous multi-user abort, large-table locks, or realistic data volume.
- Every table and operation in [rls-policy-matrix.md](rls-policy-matrix.md).
- Work-order counter formatting, date reset, concurrency, or number immutability.
- Accepted/rejected status transitions and activity-log insertion.

Add direct policy tests table by table. Do not weaken the expected result to a policy count alone.

### Hosted Supabase integration tests

Run against a disposable local or staging Supabase target, never production. Use real anon/authenticated clients for user behavior and reserve service role for setup/cleanup.

Required scenarios:

- Two users in distinct workshops cannot select, insert through a foreign parent, update, delete, sign, or download across workshops.
- Anonymous access is denied for every public business table and attachment object.
- Owner/member distinctions work for workshop, settings, and membership management.
- Soft delete and restore cross the active-row boundary only through approved paths.
- Number allocation remains unique under concurrent requests and uses workshop-local date.
- Status transitions match the database graph and create the intended activity event.
- Upload accepts allowed source formats, stores normalized JPEG under the workshop path, rejects bad origin/type/size/dimensions, and cannot authorize another workshop's parent.
- Signed URL creation succeeds only for the owning workshop, and bucket configuration is private.
- Provider signup setting and `NEXT_PUBLIC_ALLOW_SIGN_UP` agree.

No hosted integration harness currently exists in the repository.

### Playwright end-to-end tests

The current spec checks that login is keyboard reachable and registration is closed by default. Expand Playwright around complete user outcomes:

- Unauthenticated redirect with safe return path, login, callback failure, logout, and closed/open registration modes.
- Create customer, vehicle, work order, line items, payment, status transition, and PDF request.
- Upload, thumbnail display, viewer keyboard behavior, before/after slider, and soft delete.
- Desktop and mobile navigation, global command search, error/offline behavior, and focus restoration.
- Dark mode, reduced motion, browser axe, 200% zoom smoke, and no unexpected console errors.

Use stable roles/labels and controlled seeded data. Do not couple tests to generated class names or arbitrary timeouts. Network or mutation waits should observe the actual response/UI condition.

## CI policy

Current CI runs on pull requests and pushes to `main` with read-only repository permissions and a 20-minute timeout. It does not run Playwright, hosted integration tests, a migration against real Supabase, coverage thresholds, performance budgets, or restore drills.

Recommended release gates:

| Change                   | Required evidence                                                        |
| ------------------------ | ------------------------------------------------------------------------ |
| Pure documentation       | Link/format review; no application claim added without evidence          |
| Domain/schema/type logic | Relevant unit tests plus full Vitest, typecheck, lint                    |
| Migration/RLS/function   | PGlite clean chain plus hosted staging policy tests and backup preflight |
| UI component/form        | Testing Library interaction, axe where useful, affected screen checklist |
| Route/auth/upload        | Playwright plus hosted staging integration                               |
| Dependency/build         | Full CI, raw/compressed bundle comparison, relevant smoke                |
| Backup/restore           | Isolated restore drill with database and object reconciliation           |

## Test-data rules

- Use synthetic names, emails, VINs, plates, images, payment references, and insurance data.
- Never copy production rows or attachment bytes into local test output or CI artifacts.
- Keep service-role credentials out of browser fixtures, traces, screenshots, logs, and pull requests.
- Ensure Playwright traces/screenshots do not retain sensitive staging data.
- Generate unique workshop/user IDs per test worker and clean up through privileged setup code only.

## Priority gaps

1. Add live Supabase RLS/Storage verification for every matrix resource and operation.
2. Put Playwright in a controlled CI job and cover authenticated desktop/mobile flows.
3. Add upload route and image-processor tests, including malformed/decompression cases.
4. Add work-order numbering concurrency and status-transition database tests.
5. Expand Testing Library/axe coverage to forms, drawer, command search, custom viewer, upload, and slider.
6. Add logging-redaction tests and remove raw console-error paths.
7. Establish meaningful coverage and performance gates after baselines are reproducible.
8. Automate and test complete backup/restore, including Storage bytes.
