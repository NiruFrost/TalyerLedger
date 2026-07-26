# ADR-0007: Soft Deletion for Operational Records

- Status: Accepted
- Date: 2026-07-23

## Context

Work orders, payments, customers, assets, evidence, and related workshop records contribute to operational, financial, and maintenance history. Ordinary deletion must not silently destroy those records or make identifiers reusable. At the same time, deleted records should disappear from normal workflows and, where appropriate, be recoverable.

The migration chain uses nullable `deleted_at` columns on most mutable business tables. Migration `00009_phase0_tenant_security.sql` adds tenant-scoped `soft_delete_record` and `restore_record` functions because active-row RLS prevents an ordinary client query from selecting a deleted row for restoration.

## Decision

Operational and audit-sensitive records use soft deletion unless a separate retention rule explicitly permits permanent removal.

- Deletion sets `deleted_at` and preserves the UUID, work-order number, foreign-key history, and audit metadata.
- Ordinary reads return active rows only. RLS enforces the active-row boundary where applicable, and repositories may repeat the filter for query clarity and relation filtering.
- Client code uses allowlisted, workshop-scoped database functions for deletion and restoration rather than unrestricted updates or hard `DELETE`.
- Hard deletion is not granted to ordinary authenticated clients.
- Append-oriented activity logs are retained and are not treated as ordinary mutable records.
- Soft deletion does not imply an automatic child cascade. Aggregate use cases must explicitly define whether children are hidden by an active-parent query or soft-deleted in the same transaction.
- Attachment object removal is a separate retention operation. Soft-deleting attachment metadata does not immediately destroy the stored evidence.
- Restoration must revalidate ownership and any uniqueness or active-parent constraints.

## Consequences

- Positive: Accidental deletion is recoverable and historical references remain stable.
- Positive: Voided or deleted work-order numbers are never available for reuse.
- Positive: Audit and maintenance history can remain available to controlled administrative workflows.
- Tradeoff: Every normal query and relevant index must account for active rows.
- Tradeoff: Retained records and files consume storage and require a documented retention and purge process.
- Tradeoff: Parent and child soft-deletion semantics require explicit aggregate design; foreign-key cascades do not solve them.

## Alternatives Considered

- Hard-delete records immediately: Rejected because it is destructive and conflicts with operational traceability.
- Represent deletion only as a business status: Rejected because lifecycle status and removal from ordinary views are different concerns.
- Let each component update `deleted_at` directly: Rejected because restoration and tenant checks would be inconsistent and deleted rows are outside ordinary SELECT policies.
- Cascade soft deletion automatically for every relationship: Rejected because not every child has the same retention or restoration semantics.

## Migration and Deferred Conflicts

- Earlier migrations add `deleted_at` broadly; migration `00009` fills omissions, applies active-row RLS, and defines allowlisted soft-delete and restore RPCs.
- `src/lib/database/soft-delete.ts` and current customer, vehicle, work-order, line-item, payment, attachment, catalog, and package actions use these RPCs.
- The migration test verifies that a soft-deleted customer is hidden from the owner while the row and workshop ownership remain stored.
- The current generic RPC soft-deletes one row and does not cascade to children. Callers must not assume aggregate-wide deletion until a feature-specific transaction or parent-aware read policy exists.
- Some legacy foreign keys still specify hard-delete `CASCADE`. Ordinary clients cannot hard-delete under the accepted policy, but privileged retention work must review these constraints before any purge.
- Migration `00009` was not live-applied or live-verified in this session, so RPC availability and hosted behavior remain a deployment prerequisite.
- Automated retention, physical attachment purge, and administrative deleted-record views are deferred until their product and privacy requirements are approved.
