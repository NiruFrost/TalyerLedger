# ADR-0008: Work-Order Numbering

- Status: Accepted
- Date: 2026-07-23

## Context

Workshop users need a short, readable reference for estimates, work orders, documents, and customer communication. A count performed in the browser is subject to duplicate allocation under concurrency, uses the browser's timezone, and can accidentally reuse numbers after deletion. A UUID remains necessary for relational identity but is not suitable as the everyday reference.

The required format is `YY-MMDD-000001`. Migration `00009_phase0_tenant_security.sql` introduces a per-workshop, per-local-date counter and the `next_work_order_number` function. Current create and copy actions call that function before inserting a work order.

## Decision

Work-order numbers are allocated by the database with these rules:

- Format is `YY-MMDD-000001`, with exactly six sequence digits.
- `YY-MMDD` is calculated using the configured workshop timezone.
- The sequence starts at `000001` for each workshop on each local calendar day.
- Allocation uses an atomic database upsert or equivalent concurrency-safe operation.
- The work-order UUID remains the primary key; the number is a human-readable immutable reference.
- Numbers are unique within a workshop, are never reused, and remain assigned after soft deletion or voiding.
- Gaps are valid when a number is allocated but work-order creation later fails or is abandoned.
- Browsers and clients do not derive the next number from counts or local clocks.

## Consequences

- Positive: Concurrent users cannot receive the same number from a count race.
- Positive: Number dates are consistent with workshop operations rather than client location.
- Positive: Historical references remain stable through deletion and voiding.
- Tradeoff: Number allocation depends on a database function and configured IANA timezone data.
- Tradeoff: The sequence is intentionally not gapless, so it must not be presented as proof that no work order was omitted.
- Follow-up: Number immutability and concurrent allocation need database-level tests in addition to application tests.

## Alternatives Considered

- Generate from the current row count in the browser: Rejected because it is not atomic, timezone-safe, or deletion-safe.
- Use one global sequence: Rejected because workshop-local daily references are the approved operational format.
- Reset yearly: Rejected because the specification requires a daily reset.
- Show UUIDs as the only number: Rejected because they are impractical for workshop communication.
- Require a gapless sequence: Rejected because rollbacks and failed inserts would either reuse numbers or require unsafe transaction coupling.

## Migration and Deferred Conflicts

- Migration `00009` creates `work_order_number_counters`, implements atomic allocation, and changes uniqueness to `(workshop_id, estimate_no)`.
- Current `createWorkOrder` and `copyWorkOrder` use `next_work_order_number`; allocation and row insertion are separate calls, so a failed insert can consume a number. This is accepted gap behavior.
- The schema and application still name the field `estimate_no`. A future terminology migration may rename it to `work_order_no` or `job_no`, but must preserve every value.
- The unused `generateEstimateNumber` helper and `ESTIMATE_NO_PATTERN` still describe a five-digit, client-clock format. They conflict with this decision and must not be used for work-order allocation.
- Migration `00009` enforces the Phase 0 text format for new rows, makes `estimate_no` immutable, removes the direct authenticated insert policy, and seeds counters from existing six-digit-format values.
- The migration test exercises exact formatting, concurrent allocation, tenant-separated counter rows, direct-insert denial, and number immutability. A timezone/day rollover still requires a controlled clock or live integration test.
- Migration `00009` was not live-applied or live-verified in this session. Live work-order creation must not be assumed to have atomic numbering until it is deployed and verified.
