# ADR-0002: Documents Are Generated from Work Orders

- Status: Accepted
- Date: 2026-07-23

## Context

The same work order can produce a service estimate, job order, statement of account, payment acknowledgment, inspection report, or maintenance report. These outputs present selected operational data for a particular audience and point in time. They must not become competing sources for customer, line-item, payment, or status data.

The schema has a `documents` table from migration `00005_work_order_document_attachment.sql`. Current PDF preview and download components render directly from the current work order and related rows. The document label is currently inferred from work-order status, and no document feature writes snapshots or revisions.

## Decision

Documents are rendered or snapshotted views generated from a work order.

- Draft previews may render from current work-order data and have no independent historical authority.
- A finalized or issued document must eventually store an immutable snapshot of the values used to render it, including its explicit document type, issuance metadata, and revision identity.
- Editing a work order after issuance must not mutate an earlier finalized snapshot. A later issue creates a new revision linked to the same work order.
- Document rows reference the source work order and do not duplicate mutable domain ownership.
- Document type is explicit. Work-order status may suggest a default type but must not be the only identity of an issued document.
- Labels such as `Official Receipt` or `Sales Invoice` are not used unless required business-registration configuration exists and the owner explicitly approves the terminology.

## Consequences

- Positive: Operational truth remains in the work order while finalized outputs can preserve what was actually issued.
- Positive: Multiple document types and revisions can coexist without cloning the work-order lifecycle.
- Tradeoff: Immutable snapshots intentionally duplicate selected data and require retention, storage, revision, and access rules.
- Tradeoff: Live previews and finalized documents have different persistence semantics that the UI must communicate.
- Follow-up: Snapshot schemas and rendering inputs require deterministic tests.

## Alternatives Considered

- Generate PDFs only and keep no document record: Rejected because issuance, revision, and audit history would be unavailable.
- Make each document an independently editable copy of business data: Rejected because copies would drift from the work order and from one another.
- Overwrite one document row on every generation: Rejected because previously issued content would lose its history.
- Infer all document types from status: Rejected because one work-order state can require more than one valid output.

## Migration and Deferred Conflicts

- The current `documents` table stores basic metadata only. It has no snapshot payload, revision number, immutable-finalization constraint, or document feature UI.
- Current PDF code reads live work-order, line-item, payment, customer, vehicle, settings, and attachment data. It does not create a `documents` row, so previously downloaded output cannot be reproduced as an immutable revision from the database.
- Document snapshot revisions are explicitly deferred to Phase 3, including schema design, issuance workflow, storage, and migration of any records that need historical treatment.
- Migration `00009_phase0_tenant_security.sql` adds workshop scope to `documents`, but migration `00009` was not live-applied or live-verified in this session.
