# Phase 0 Final Validation

Date: 2026-07-26

Environment: Windows, Node 22-compatible local runtime, Next.js 16.2.11

## Command record

| Command/check | Initial result | Correction | Final result |
| --- | --- | --- | --- |
| `npm.cmd install` | Passed at baseline | None | Dependencies present |
| `npm.cmd run lint` | Passed | Phase 0 changes were linted again | Passed, zero output |
| Previous `npm run typecheck` definition | Built the application instead of performing an independent static check; a later status-RPC call initially exposed one nullable closure type error | Set to `next typegen && tsc --noEmit`, captured the narrowed version before the async handler, and reran | Passed |
| `npm.cmd run db:test` | First hardening run failed on a reusable trigger record field; then the finance fixture failed because direct work-order insert was intentionally removed | Used JSON row access in the shared relationship trigger and updated fixtures to the atomic RPC; added security cases | Passed: 9/9 |
| `npm.cmd run test:run` | Baseline 45/45 | Added safe-error and migration/RLS coverage | Passed: 50/50 across 9 files |
| `npm.cmd run build` | Passed at baseline | Rebuilt after final code changes | Passed; all routes compiled/generated |
| `npx.cmd playwright test` | Baseline passed | Repeated after auth/UI/security changes | Passed: desktop Chromium and mobile Chromium, 2/2 |
| In-app browser review | Login entry reviewed at 390 x 844; pre-fix controls were 36 px | Set auth controls to 44 px and corrected semantic validation | Passed: 44 px controls, no horizontal overflow, skip link, form alerts, protected redirect |
| `npm.cmd audit --omit=dev --audit-level=high` | Failed: three High findings under Next's PostCSS 8.5.10 | Verified current Next is 16.2.11 and identified patched PostCSS releases. Attempted registry-backed update; environment rejected disclosure of dependency metadata. Offline cache did not contain the release. Restored the consistent lock/override state. | Failed: three High findings, CI remains intentionally red |
| Documentation consistency search | Found stale `refund`, number mutability, attachment visibility, upload-limit, search, and test-count claims | Updated current architecture, schema, product, RLS, threat, deployment, testing, performance, motion, ADR, README, and finalization docs | Passed for reviewed current-state claims |

## Independent database evidence

The clean-chain suite now covers:

- tenant isolation and cross-workshop parent rejection;
- anonymous read/write denial;
- direct soft-delete denial and RPC delete/restore behavior;
- child restoration denial while its operational parent is deleted;
- restrictive hard-delete foreign keys;
- owner/member/private/customer attachment behavior;
- exact attachment path binding, duplicate-path rejection, and Storage reads;
- database-calculated line totals and payment status;
- direct derived-payment mutation denial;
- atomic work-order create/update/copy and stale-version rejection;
- direct work-order insert denial, draft-only creation, status transitions, and number immutability;
- concurrent format allocation and separate tenant counter state.

PGlite is not hosted Supabase. Before production, apply the migrations to an
isolated project and repeat catalog, grant, JWT, Storage, and signed-URL checks.

## Browser and accessibility evidence

- Desktop and Pixel 7 Playwright projects passed keyboard navigation and closed-registration checks.
- Manual mobile DOM geometry measured email, password, and submit controls at 44 px.
- Empty submit exposed associated `alert` messages for email and password.
- `/jobs?view=active` redirected to `/login?next=%2Fjobs%3Fview%3Dactive`.
- The login page had a main-content skip link and no horizontal overflow.
- Global reduced-motion CSS was inspected; operating-system reduced-motion emulation was not completed.

## External and operational validation not performed

- Live Supabase migration history/drift and real JWT grants.
- Hosted Storage upload, signed URLs, and legacy bucket state.
- Provider signup/password/MFA configuration.
- Scheduled backup plus isolated restore of database, Auth linkage, and Storage bytes.
- Production CDN/edge headers, telemetry, p75/p95 latency, bundle transfer, and capacity.

## Final gate

Local implementation, tests, type checking, build, and browser checks pass.
Production dependency audit does not. Phase 1 progression is therefore
rejected until the High findings are removed and the full CI sequence is green.
