# ADR-0004: Generic Attachment Model

- Status: Accepted
- Date: 2026-07-23

## Context

Repair evidence includes more than photos and belongs to more than one entity. Images, authorization letters, diagnostic reports, warranty documents, identity documents, and future tool-condition evidence may belong to a vehicle or asset, work order, line item, representative, payment, tool, borrower, loan, or inspection. Separate photo tables or one attachment table per feature would duplicate upload, privacy, audit, and storage behavior.

Migration `00005_work_order_document_attachment.sql` introduced polymorphic `attachments`, and migration `00008_repair_documentation.sql` separated evidence category from file kind and added storage paths and image metadata. A legacy `photos` table still exists.

## Decision

New evidence and uploaded files use one generic Attachment model.

- Attachment metadata records a constrained `parent_type` and `parent_id`, evidence category, file kind, MIME type, storage path, thumbnail path, file metadata, visibility, ordering, uploader, audit fields, and soft-deletion state as applicable.
- Evidence category and file kind are separate concepts. For example, an authorization letter is a category and may be an image or PDF.
- Supported parent types and categories are database-constrained and expanded deliberately with parent-ownership validation. Arbitrary unchecked polymorphic values are not allowed.
- Storage access remains behind a provider service. Database metadata stores stable provider paths rather than treating public URLs as identity.
- Storage objects are private by default, use signed reads, and are scoped to the owning workshop. Personal documents require stricter visibility than ordinary workshop evidence.
- Client deletion soft-deletes metadata. Physical object deletion is a separate retention operation so evidence is not irreversibly removed by an ordinary UI action.
- New features do not add feature-specific photo tables.

## Consequences

- Positive: Upload, gallery, audit, privacy, retention, and provider behavior can be shared across features.
- Positive: Storage can move from Supabase Storage to another provider without changing domain ownership.
- Tradeoff: A polymorphic parent cannot use one ordinary foreign key, so constraints and trigger validation are required.
- Tradeoff: Visibility and retention rules must account for the sensitivity of both parent and category.
- Tradeoff: Broad file support requires server-side validation pipelines per file kind, not only a permissive MIME field.

## Alternatives Considered

- Keep the legacy `photos` table: Rejected because it cannot represent non-image files or the planned parent types cleanly.
- Add one attachment table per feature: Rejected because security, storage, processing, and UI behavior would be duplicated.
- Store public URLs directly on parent rows: Rejected because it weakens privacy, provider portability, metadata, and auditability.
- Allow any `parent_type` string without validation: Rejected because orphaned and cross-workshop references would be possible.

## Migration and Deferred Conflicts

- Migrations `00005` and `00008` establish the generic metadata direction, but the legacy `photos` table has not been migrated away or dropped.
- The database constraint currently includes `customer` as well as `vehicle`, `work_order`, and `line_item`. TypeScript types, UI constants, and the upload API currently support only `vehicle`, `work_order`, and `line_item`.
- The current upload pipeline accepts images only and normalizes them to JPEG. Generic PDF, document, video, and other-file upload validation is not implemented even though `file_kind` can represent those types.
- Migration `00009_phase0_tenant_security.sql` adds workshop scope, visibility, parent validation, metadata fields, and a private bucket. Its tests cover workshop isolation for attachment metadata and storage objects, but not all visibility classes or future public-token flows.
- Migration `00009` was not live-applied or live-verified in this session. The hosted bucket and policies must not be assumed to match the migration until separately deployed and checked.
- Additional parent types, sensitive-document isolation, non-image processors, and legacy-photo migration are deferred to their approved product phases.
