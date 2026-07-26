# ADR-0001: Work Order as the Permanent Operational Record

- Status: Accepted
- Date: 2026-07-23

## Context

TalyerLedger follows a maintenance lifecycle that starts with intake and continues through estimate, approval, execution, payment, release, and history. Treating each estimate, job order, statement, or PDF as a separate primary business record would fragment that lifecycle and make status, evidence, payments, and audit history difficult to reconcile.

Migration `00005_work_order_document_attachment.sql` renamed `jobs` to `work_orders` and made line items, payments, documents, activity logs, and attachments refer to the work order. The current application still uses `/jobs` routes, the legacy `estimate_no` column, and deprecated `Job` type aliases in some PDF code.

## Decision

The `work_orders` row identified by its UUID is the permanent operational record for a repair or maintenance engagement.

- Customer, asset or vehicle, line items, repair status, payment status, notes, evidence, payments, linked warranty or comeback work, and activity history belong to or reference the work order lifecycle.
- A work order may change through controlled, audited lifecycle transitions; it is not replaced when a different document is produced.
- Estimate, job order, statement of account, payment acknowledgment, inspection report, and maintenance report outputs are derived document views, not replacement domain entities.
- Voiding or soft deletion preserves the work order, its work-order number, and its history. It does not release the number for reuse.
- The database UUID remains the relational identifier. The human-readable work-order number is a permanent reference, not a primary key.
- Repair status and payment status remain separate concerns.

## Consequences

- Positive: One record provides a continuous maintenance and financial history across all workflow stages.
- Positive: Evidence, payments, document records, and later analytics can share a stable UUID.
- Tradeoff: Work-order aggregates become important query and transaction boundaries and require explicit concurrency and transition controls.
- Tradeoff: Until document snapshots exist, editing a work order can change a newly rendered PDF even if an earlier PDF was already sent.
- Follow-up: Activity and audit data must make material lifecycle changes traceable.

## Alternatives Considered

- Use the PDF as the authoritative record: Rejected because a rendered file cannot safely coordinate workflow, payments, evidence, or relational history.
- Model estimates, job orders, and invoices as unrelated records: Rejected because conversion and synchronization would duplicate operational data and create conflicting truth.
- Copy a new work order for every status stage: Rejected because it breaks a single maintenance history and complicates numbering and payments.

## Migration and Deferred Conflicts

- Migration `00005_work_order_document_attachment.sql` established the `work_orders` table and renamed child foreign keys.
- The `/jobs` route, `estimate_no` field, and deprecated `Job` aliases are legacy presentation and compatibility names. They do not change the accepted domain entity.
- Finalized document snapshots and revisions are deferred to Phase 3 and are governed by ADR-0002.
- Migration `00009_phase0_tenant_security.sql` adds `version` and stronger workflow controls, but migration `00009` was not live-applied or live-verified in this session.
