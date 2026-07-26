# Phase 0 Completion Report

## Outcome

Phase 0 finalization is **not approved for Phase 1 yet**. The application,
database migration, test, build, browser, CI-definition, and documentation work
is complete within the accessible repository, but the production dependency
audit still reports three High findings.

## Completed in this pass

- Replaced request-host-derived auth redirects with the configured canonical site URL.
- Hardened logout navigation and mapped authentication failures to safe messages.
- Restored independent static type checking and made browser/CI failures blocking.
- Centralized all remaining TanStack Query keys and tightened invalidation.
- Hardened attachment request size, parent support, semantic UI feedback, rate limiting, private visibility, metadata/object path binding, and duplicate protection.
- Enforced database-owned work-order numbers, draft creation, status transitions, optimistic versions, derived financial state, stored line totals, restrictive hard-delete relationships, active-parent rules, soft-delete boundaries, and tenant ownership.
- Expanded the clean migration/RLS suite to 9 cases and the full suite to 50 tests.
- Reconciled current architecture/security/schema/testing/operations documentation.

## Validation summary

- Lint: passed.
- Typecheck: passed.
- Vitest: 50/50 passed.
- Migration/RLS subset: 9/9 passed.
- Production build: passed.
- Playwright: 2/2 projects passed.
- Manual mobile/auth browser review: passed for the tested entry surface.
- Production dependency audit: failed, three High PostCSS findings.

## Blocking issue

The current override resolves PostCSS 8.5.10. The audit reports
`GHSA-6g55-p6wh-862q` and `GHSA-r28c-9q8g-f849` through Next and
next-cloudinary. The environment allowed a read-only audit but rejected
registry-backed dependency mutation; the patched release was not cached
offline.

Required next action:

1. Explicitly authorize npm registry access for this project.
2. Update the PostCSS override to a patched release and refresh `package-lock.json`.
3. Run `npm ci`, lint, typecheck, all tests, build, Playwright, and the production audit.
4. Approve Phase 1 only when the audit and full CI sequence pass.

## Non-blocking pre-production limitations

- Hosted Supabase/RLS/Storage remains unrehearsed.
- Backup and restore are documented but not operationally proven.
- Production performance budgets are targets, not measured results.
- Legacy `photos` table/bucket cleanup requires a deployment-specific, backed-up operation.
- Attachment upload and metadata insertion are not one cross-service transaction; orphan cleanup is not automated.
