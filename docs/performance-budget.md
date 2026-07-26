# Performance Budget

## Status and evidence boundary

This document sets release budgets and records the diagnostics that the current repository can support. It does not claim measured production latency, Core Web Vitals, browser rendering performance, Supabase query latency, upload throughput, or capacity.

A production build was run on 2026-07-23 against the current worktree with non-secret CI-style public placeholders supplied to that process. The successful build used:

| Item             | Value                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------- |
| Operating system | Windows                                                                                     |
| Node             | `v24.15.0`                                                                                  |
| npm              | `11.14.0`                                                                                   |
| Next.js          | `16.2.11`                                                                                   |
| Bundler          | webpack, through `npm run build`                                                            |
| Build result     | Compiled, typechecked, generated static output, and collected traces successfully           |
| Route output     | `_not-found` and `/register` static; application/API routes otherwise dynamic in this build |

The project standard is Node 22 in `.nvmrc` and CI. Node 24 is within `package.json`'s `>=22 <25` range, but the local timing below is not a CI or production-machine comparison.

An earlier ignored `.next` directory reported Next.js `16.2.10` while the lockfile resolved `16.2.11`; it was stale and was replaced by the successful build. Because `.next/` is ignored, any future local artifact must be checked against the lockfile and current commit before use.

## Measured build diagnostics

### Build timing

| Stage reported by Next.js |                   Local result | Interpretation                                               |
| ------------------------- | -----------------------------: | ------------------------------------------------------------ |
| Optimized compilation     |                         10.3 s | Machine- and cache-dependent build time, not runtime latency |
| TypeScript stage          |                          6.6 s | Build-stage diagnostic only                                  |
| Static page generation    | 421 ms for 7 generated entries | Build-stage diagnostic only                                  |

### Uncompressed artifact accounting

These figures are raw file sizes under the generated `.next/static` directory. They are explicitly **uncompressed**. They are not HTTP transfer sizes, parsed/compiled JavaScript cost, initial route payload, cache behavior, or a browser measurement.

| Artifact set                                          |                      Raw size |
| ----------------------------------------------------- | ----------------------------: |
| All 77 generated static JavaScript files              | 3,320,731 bytes (3,242.9 KiB) |
| Four `rootMainFiles` from `.next/build-manifest.json` |     426,964 bytes (417.0 KiB) |
| Generated global CSS                                  |       62,041 bytes (60.6 KiB) |
| All 13 generated WOFF2 files                          |     289,404 bytes (282.6 KiB) |
| Largest JavaScript chunk                              |     640,557 bytes (625.5 KiB) |
| Second-largest JavaScript chunk                       |     365,219 bytes (356.7 KiB) |
| Third-largest JavaScript chunk                        |     245,807 bytes (240.0 KiB) |

Next 16's build console did not report "First Load JS" or compressed route sizes. As a secondary raw diagnostic, route client-reference manifests were resolved to unique referenced JS files and combined with `rootMainFiles`:

| Route manifest    |   Raw referenced plus root JS | Important limitation                                             |
| ----------------- | ----------------------------: | ---------------------------------------------------------------- |
| `/login`          | 1,059,707 bytes (1,034.9 KiB) | Not compressed or browser-confirmed                              |
| `/`               |   1,017,243 bytes (993.4 KiB) | Not compressed or browser-confirmed                              |
| `/jobs/[id]`      | 1,184,609 bytes (1,156.8 KiB) | Not compressed or browser-confirmed                              |
| `/jobs/[id]/edit` | 1,225,992 bytes (1,197.3 KiB) | Highest sampled manifest accounting                              |
| `/jobs/[id]/pdf`  | 1,191,679 bytes (1,163.7 KiB) | Does not establish when dynamically imported PDF chunks transfer |

This manifest accounting is useful only as a same-method regression signal. It may include shared references that the browser already cached and may exclude asynchronously loaded chunks. Do not compare these raw values to compressed-transfer budgets or label them "initial JS."

## Release budgets

### User experience budgets

These are targets to measure at the 75th percentile with production-like data and geography. Current baseline: **not measured**.

| Metric                        |                              Budget | Measurement scope                                              |
| ----------------------------- | ----------------------------------: | -------------------------------------------------------------- |
| Largest Contentful Paint      |                          `<= 2.5 s` | Login, dashboard, customer/vehicle/work-order lists and detail |
| Interaction to Next Paint     |                         `<= 200 ms` | Search, tabs, menus, form editing, line-item operations        |
| Cumulative Layout Shift       |                           `<= 0.10` | Full route session, including loading-to-content transition    |
| Time to First Byte            |                     `<= 800 ms` p75 | Dynamic HTML/RSC from the selected production region           |
| Route-change visible feedback |                         `<= 100 ms` | Skeleton, pending label, or new content appears                |
| Search result feedback        | `<= 500 ms` p75 after input settles | At least two characters; production-like database              |
| Standard read completion      |      `<= 1.0 s` p75, `<= 2.5 s` p95 | Excludes attachment bytes and PDF generation                   |
| Standard write completion     |      `<= 1.5 s` p75, `<= 3.0 s` p95 | Create/update plus required recalculation                      |

Latency targets are not contractual SLOs until the production region, network profile, dataset, and telemetry are defined. Do not average away slow workshop/mobile sessions.

### Browser resource budgets

Measure compressed transfer on a cold cache and execution on a representative mid-tier mobile device. Current baseline: **not measured**.

| Resource                                        |                                                                  Budget |
| ----------------------------------------------- | ----------------------------------------------------------------------: |
| Initial compressed JS, auth route               |                                                            `<= 250 KiB` |
| Initial compressed JS, normal dashboard route   |                                                            `<= 350 KiB` |
| Additional compressed JS for PDF feature        |                         `<= 500 KiB`, loaded only when PDF is requested |
| Initial compressed CSS                          |                                                             `<= 40 KiB` |
| Initially used font transfer                    | `<= 150 KiB` and no invisible-text interval beyond `font-display: swap` |
| Third-party runtime requests before user action |      `0`, except required Supabase/session and self-hosted route assets |
| Long tasks during ordinary route interaction    |  No task over 200 ms; fewer than 2 tasks over 50 ms during route settle |

The raw build accounting currently cannot pass or fail these compressed/browser budgets. Add a repeatable browser/bundle measurement before enforcing them in CI.

### Image, upload, and PDF budgets

| Concern                 | Budget or current guard              | Enforcement state                                                 |
| ----------------------- | ------------------------------------ | ----------------------------------------------------------------- |
| Raw source image size   | `<= 10 MiB`                          | Enforced before client processing; bucket also caps stored objects |
| Processed request size  | `<= 4 MiB`                           | Enforced by upload route with multipart-header headroom             |
| Source image pixels     | `<= 40,000,000`                      | Enforced client and Sharp server decode                           |
| Full stored dimension   | Longest side `<= 1920 px`            | Enforced server; client also resizes                              |
| Thumbnail width         | `<= 400 px`                          | Enforced server/client processing                                 |
| Thumbnail encoded size  | Target `<= 200 KiB` p95              | Not measured or byte-enforced                                     |
| Full stored image size  | Target `<= 1.5 MiB` p95              | Not measured or byte-enforced after encoding                      |
| PDF appendix metadata   | `<= 30` customer-visible attachments | Enforced by `getCustomerSafeAttachments()`                        |
| PDF generation feedback | Visible pending state within 100 ms  | Source has spinner/text; browser timing unverified                |

The upload progress currently represents completed file count, not bytes transferred. Do not present it as network-percent accuracy. Upload throughput and server CPU/memory have not been measured.

### Data/query budgets

| Query area                                                      | Current behavior                                                        | Budget/action                                                                                                    |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Global search                                                   | Three parallel queries, five rows each after two characters             | Keep maximum 15 result rows; add input deferral/debounce and cancellation if measured request churn is excessive |
| Customer list                                                   | Maximum 100                                                             | Add explicit pagination and total/result messaging before datasets exceed 100                                    |
| Work-order list and by-vehicle list                             | Maximum 100, with nested line items/payments                            | Paginate and reduce selected relation width before larger deployments                                            |
| Service packages                                                | Maximum 100 plus items                                                  | Keep bounded; paginate if catalog grows                                                                          |
| Customer-safe PDF attachments                                   | Maximum 30                                                              | Keep bounded                                                                                                     |
| Vehicles, labor items, payments, line items, normal attachments | No explicit limit                                                       | Add pagination/windowing before production data can grow without bound                                           |
| TanStack Query cache                                            | 30 s stale time; one retry maximum for queries; no window-focus refetch | Revisit only with measured freshness and request-volume data                                                     |

List caps must not silently hide records. Pagination is a correctness requirement as well as a performance control.

## Measurement procedure

### Every pull request affecting dependencies or rendering

1. Run `npm ci` under Node 22.
2. Run `npm run build` with production-shaped, non-secret environment values.
3. Compare current raw build artifacts using the same script/method; investigate route or total raw-JS growth over 10%.
4. Inspect whether a large dependency moved into shared/root chunks or loads only on its feature route.
5. Exercise affected routes with production throttling in browser tooling and record compressed requests, main-thread tasks, and layout shift.

### Before release

1. Use a staging deployment in the intended web and Supabase regions.
2. Seed representative row counts, long labels, attachment galleries, and a 30-image PDF appendix.
3. Measure cold and warm navigation on desktop and a mid-tier mobile profile.
4. Record p75/p95 from repeated runs; do not report the fastest run.
5. Run field telemetry only with approved privacy-safe event fields and no PII, signed URLs, or record payloads.

Suggested tools are browser Performance/Network panels, Lighthouse for lab diagnostics, WebPageTest for network/device repeatability, and platform/Supabase query diagnostics. None is configured in the repository today.

## Known hotspots

- Root `Providers` installs TanStack Query, theme, offline detection, and toast support for every route, including auth routes.
- `@react-pdf/renderer` produces large chunks. The preview route dynamically imports `PdfPreview`, but detail-page PDF download code still needs route-level bundle inspection.
- Work-order list/detail selects nested vehicles, customers, line items, payments, and linked orders; the 100-row list can return a large payload.
- Several list queries are unbounded, and no virtualization exists.
- Attachment galleries request separate signed URLs per image; no batching or URL-refresh strategy is measured.
- Client image processing and server Sharp processing duplicate work by design for defense in depth but affect low-memory phones and server CPU.
- Full attachment objects remain after metadata soft deletion, so storage growth has no automated bound.
- No application telemetry, query plan baseline, bundle analyzer, or performance CI gate exists.

## Regression policy

- A Core Web Vital over budget blocks release unless the owner accepts a time-bounded exception with evidence.
- A compressed route-resource increase over 10% requires an explanation; over 20% requires mitigation or explicit approval.
- Do not "fix" a regression by removing accessibility semantics, validation, tenant checks, image validation, or user feedback.
- Update the measured section only from a reproducible current build or browser run. Label raw, compressed, cached, device, data volume, and date.
- Delete or clearly mark stale figures when framework version, route composition, build mode, or measurement method changes.

See [testing-strategy.md](testing-strategy.md) and [deployment.md](deployment.md) for release commands and evidence limits.
