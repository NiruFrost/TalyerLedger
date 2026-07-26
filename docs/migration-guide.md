# Migration Guide

## Current migration status

The repository contains nine ordered SQL migrations in `src/db/migrations`.

Migration `00009_phase0_tenant_security.sql` is exercised by `src/db/tests/migrations.test.ts` in PGlite. The test runs the complete clean chain, then verifies workshop provisioning, RLS isolation, anonymous denial, cross-workshop FK protection, soft deletion, attachment metadata isolation, storage read isolation, and private bucket settings.

Migration `00009` was **not applied to or verified against a live Supabase project in this documentation session**. PGlite is clean-chain evidence, not a deployment record. A live target may contain manual changes, partial migrations, old versions of repaired files, data that violates new checks, or legacy storage paths.

## Important repository facts

- Migration files live under `src/db/migrations`, not Supabase CLI's conventional `supabase/migrations` directory.
- The repository has no Supabase `config.toml` or checked-in project linkage.
- There is no repository-managed deployment ledger proving which migration version a remote target received.
- Remote schema drift therefore requires a preflight before every application, especially before `00009`.
- Legacy migration files `00005`, `00006`, and `00008` were repaired in the repository. Their current contents may not match copies previously run on a remote project.

Do not infer live state from filenames, root documentation, or the fact that the application currently compiles.

## Migration inventory

| Migration                                  | Main change                                                                                                   | Data impact and rollback character                                                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `00001_initial_schema.sql`                 | Core enums/tables, broad authenticated RLS, audit triggers, default shop-settings row                         | Creates base schema. Commented down SQL drops all application data and is destructive.                                                                     |
| `00002_line_items_enhancements.sql`        | Line and overall discount columns                                                                             | Adds default-zero values. Column removal would discard discounts.                                                                                          |
| `00003_photos_audit_storage.sql`           | Photo audit columns and broad legacy `photos` storage policies                                                | Adds columns/triggers. The bucket creation is only commented guidance; do not assume the bucket exists.                                                    |
| `00004_v2_enhancements.sql`                | `voided`, payer/insurance/link fields, payment type, registration fields                                      | Adding an enum value is not simply reversible. New columns contain business data after use.                                                                |
| `00005_work_order_document_attachment.sql` | Renames `jobs` to `work_orders` and child keys; adds documents, activity logs, attachments                    | Renames preserve rows, but reverting after clients write new tables/columns requires coordinated mapping. `photos` remains present.                        |
| `00006_status_workflow_internal_notes.sql` | New work-order enum, internal/payment status, old-status conversion                                           | Status conversion is lossy: invoiced/partially-paid become completed and paid becomes released. Down guidance cannot reconstruct the original distinction. |
| `00007_notifications_labor_packages.sql`   | Notifications, labor catalog, service packages/items                                                          | Dropping tables loses catalog and notification data.                                                                                                       |
| `00008_repair_documentation.sql`           | Evolves attachments; adds drop-off fields and PDF appendix flag                                               | Copies then drops attachment URL columns and reinterprets attachment type. Rollback must preserve paths/categories created under the new model.            |
| `00009_phase0_tenant_security.sql`         | Workshop tenancy, scoped RLS, composite integrity, financial checks, status trigger, counters, secure storage | Ownership backfill and security cutover. No general down migration is provided; use verified backup recovery or a reviewed forward fix.                    |

## Repaired legacy migrations

The current clean chain includes these in-repository repairs:

### `00005`

- Removed unsupported `IF EXISTS` syntax from `ALTER TABLE ... RENAME COLUMN`.
- A remote on which the older statement failed may be partially migrated. Check table, column, index, trigger, and policy state before continuing.

### `00006`

- Backfills `payment_status` from the retired work-order status before changing the enum: old `paid` becomes payment `paid`, and old `partially_paid` becomes `partial`.
- Drops the old status default before converting the enum type, then installs the new default.
- A remote that ran an older version may have incorrect payment statuses or may have failed during enum conversion.

### `00008`

- Adds `file_kind` and copies the old `attachment_type` file-kind value into it.
- Reclassifies old file kinds (`image`, `pdf`, `docx`, `xlsx`, `video`) to evidence category `other` before installing the new category check.
- Retains `customer` as an allowed parent type.
- Requires `storage_path` after copying from the old `url` field.
- A remote that ran an older copy may have lost file-kind meaning, rejected customer attachments, or failed when the new category check encountered old values.

Do not rerun a repaired historical file blindly on a database that may already contain its objects. Build a target-specific forward reconciliation from the observed schema and data.

## Required preflight

Perform preflight on a restored clone or staging project first. Repeat read-only checks against production immediately before the change window.

### 1. Identify the target and freeze writes

- Confirm the exact Supabase project reference, region, database host, and intended environment.
- Schedule a maintenance window for a populated target.
- Disable application writes and sign-up during backup, final inventory, migration, and validation.
- Confirm who can restore the backup and how long restore will take.

### 2. Take and verify a backup

- Create a full logical backup containing schema and data, including `auth` references needed for ownership recovery.
- Export or otherwise protect Storage objects separately; a PostgreSQL dump does not contain object bytes.
- Record the backup time, target project, tool/version, object-store snapshot/export location, and checksum where available.
- Restore the backup to a disposable project/database and run basic row-count and object-count checks. An untested backup is not a rollback plan.
- Protect backup credentials and customer data with access controls appropriate to production data.

### 3. Inventory migration history and schema drift

If a Supabase migration ledger exists because another workflow used the CLI, inspect it, but verify actual objects as well. Absence of a ledger is expected in this repository layout.

Useful read-only inventory queries:

```sql
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema IN ('public', 'storage')
ORDER BY table_schema, table_name;

SELECT table_name, ordinal_position, column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename, policyname;

SELECT event_object_table, trigger_name, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

SELECT conrelid::regclass AS table_name, conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text, conname;

SELECT n.nspname AS schema_name, p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname IN ('public', 'auth')
ORDER BY n.nspname, p.proname;
```

Before `00009`, the expected structural baseline is the repaired result through `00008`:

- `public.work_orders` exists and `public.jobs` does not.
- `line_items`, `payments`, and `photos` use `work_order_id`.
- `work_order_status` exists and `job_status` has been retired.
- `attachments` has `storage_path`, `thumbnail_path`, `file_kind`, and evidence categories; old `url`/`thumbnail_url` columns are absent.
- Tables from `00007` exist.
- Drop-off fields and `include_photo_appendix` exist.

Any mismatch is drift. Stop and prepare a reviewed reconciliation instead of hoping `IF NOT EXISTS` will make the chain safe; many rename, constraint, trigger, and policy statements are intentionally not idempotent.

### 4. Inventory auth users and ownership ambiguity

Migration `00009` automatically assigns existing operational data only when exactly one auth user exists.

```sql
SELECT count(*) AS auth_user_count FROM auth.users;

SELECT 'customers' AS table_name, count(*) AS row_count FROM public.customers
UNION ALL SELECT 'vehicles', count(*) FROM public.vehicles
UNION ALL SELECT 'work_orders', count(*) FROM public.work_orders
UNION ALL SELECT 'line_items', count(*) FROM public.line_items
UNION ALL SELECT 'photos', count(*) FROM public.photos
UNION ALL SELECT 'payments', count(*) FROM public.payments
UNION ALL SELECT 'documents', count(*) FROM public.documents
UNION ALL SELECT 'activity_logs', count(*) FROM public.activity_logs
UNION ALL SELECT 'attachments', count(*) FROM public.attachments
UNION ALL SELECT 'notifications', count(*) FROM public.notifications
UNION ALL SELECT 'labor_items', count(*) FROM public.labor_items
UNION ALL SELECT 'service_packages', count(*) FROM public.service_packages
UNION ALL SELECT 'package_items', count(*) FROM public.package_items
ORDER BY table_name;

SELECT id, shop_name, address, contact_number, email
FROM public.shop_settings
ORDER BY created_at;
```

Guard behavior:

- Operational rows plus auth-user count other than one: migration aborts and the transaction rolls back.
- One auth user: all unscoped operational rows and at most one settings row are assigned to that user's workshop.
- More than one legacy settings row with one user: migration aborts for explicit reconciliation.
- No operational rows and multiple users: each user can receive an isolated workshop; an unowned default settings seed is removed and one settings row is created per workshop.
- Customized unowned settings with no single owner: migration aborts.

For a multi-user legacy database, create a reviewed, target-specific ownership mapping before cutover. Every customer, vehicle, work order, child row, catalog row, attachment, and settings row must map to a workshop consistently. Do not disable the guard or assign all records to an arbitrary user merely to make the migration pass.

### 5. Validate financial data

`00009` uses `NOT VALID` followed by `VALIDATE CONSTRAINT`. Existing invalid values abort the transaction; they are not silently changed.

```sql
SELECT id, quantity, unit_price, line_total, discount_type, discount_value
FROM public.line_items
WHERE quantity <= 0
   OR unit_price < 0
   OR line_total < 0
   OR NOT (
     (discount_type IS NULL AND discount_value = 0) OR
     (discount_type = 'amount' AND discount_value >= 0) OR
     (discount_type = 'percent' AND discount_value BETWEEN 0 AND 100)
   );

SELECT id, overall_discount_type, overall_discount_value
FROM public.work_orders
WHERE NOT (
  (overall_discount_type IS NULL AND overall_discount_value = 0) OR
  (overall_discount_type = 'amount' AND overall_discount_value >= 0) OR
  (overall_discount_type = 'percent' AND overall_discount_value BETWEEN 0 AND 100)
);

SELECT id, amount FROM public.payments WHERE amount <= 0;
SELECT id, unit_price FROM public.labor_items WHERE unit_price < 0;
SELECT id, total_price FROM public.service_packages WHERE total_price < 0;
SELECT id, quantity, unit_price
FROM public.package_items
WHERE quantity <= 0 OR unit_price < 0;
```

Investigate each result with the owner. Correcting financial history is a business decision and must be logged; do not coerce negative or invalid values automatically.

### 6. Preflight attachment metadata and object paths

The final storage read policy requires the first object-path segment to be the owning workshop UUID. Older application code created paths beginning with `vehicle/`, `work_order/`, or `line_item/`, so existing objects may become unreadable after the policy cutover.

```sql
SELECT id, parent_type, parent_id, storage_path, thumbnail_path, mime_type
FROM public.attachments
WHERE storage_path IS NULL
   OR storage_path = ''
   OR storage_path !~* '^[0-9a-f-]{36}/';

SELECT id, name, metadata
FROM storage.objects
WHERE bucket_id = 'attachments'
  AND (
    (storage.foldername(name))[1] IS NULL
    OR (storage.foldername(name))[1] !~* '^[0-9a-f-]{36}$'
  )
ORDER BY name;

SELECT bucket_id, count(*) AS object_count
FROM storage.objects
GROUP BY bucket_id
ORDER BY bucket_id;
```

For incompatible paths, plan an authenticated server-side copy/move into `<workshop_uuid>/<parent_type>/<parent_id>/<filename>` and update `storage_path`/`thumbnail_path` only after object verification. Preserve old objects until the new path, metadata, signed read, and backup are verified.

Also inventory:

- Non-JPEG objects already in `attachments`. `00009` restricts future bucket uploads to JPEG; it does not convert existing objects.
- Legacy `photos` bucket objects. `00009` removes the old broad policies but does not migrate or delete the bucket/objects.
- Orphan objects without active metadata and metadata pointing to missing objects.
- Attachment parent rows that are soft-deleted. The final parent-validation trigger requires active parents for new/changed metadata.

### 7. Estimate operational impact

- `ALTER TABLE`, constraint validation, index creation, and policy replacement can lock or scan populated tables.
- RLS replacement is a security cutover; keep application writes stopped until role-based tests pass.
- Bucket settings change to private, 10 MiB, JPEG-only.
- A service-role key must be present in the Next.js server runtime for uploads after cutover.
- Existing sessions may need refresh so current JWT/auth behavior is tested against the new policies.

## Deployment procedures

### Scenario A: clean Supabase project

1. Run `npm run db:test` locally.
2. Create a disposable Supabase staging project, not just PGlite, because migrations reference real `auth` and `storage` objects.
3. Apply complete files `00001` through `00009` in numeric order using a controlled SQL runner or the Supabase SQL editor.
4. Stop immediately on an error; do not continue to later files.
5. On an empty project, `00009` removes the unowned default settings seed. Creating an auth user after `00009` should provision workshop, owner membership, and settings.
6. Run the post-deployment checks and role-based tests below.
7. Record target project, operator, UTC time, file hashes, command/tool, results, and backup reference.

The repository does not currently provide CLI plumbing for an automatic `supabase db push`. Do not invent migration history by moving or renaming files during a production change without a separately reviewed tooling change.

### Scenario B: existing data and exactly one auth user

1. Complete every preflight step and resolve drift.
2. Confirm the target is structurally at the repaired `00008` baseline.
3. Confirm one auth user, no more than one legacy settings row, valid financial data, and an attachment-path plan.
4. Stop writes and take the final verified backup/object snapshot.
5. Apply `00009` as the complete file. It is wrapped in one transaction; a raised guard/validation error should leave none of its changes committed.
6. Perform object-path migration if required by the reviewed runbook. Coordinate metadata updates and storage copies carefully; PostgreSQL transaction rollback cannot roll back object-store copies.
7. Run post-deployment SQL and two-user RLS tests before resuming traffic.

### Scenario C: existing operational data and zero or multiple auth users

Do not apply `00009` unchanged. It deliberately aborts rather than guess ownership.

Prepare a staging-tested migration plan that:

1. Defines intended workshops and owners.
2. Maps every operational and settings row to a workshop.
3. Preserves same-workshop parent/child relationships.
4. Maps attachment object paths and metadata.
5. Installs the remaining constraints, triggers, functions, policies, and counter infrastructure atomically where database operations permit.
6. Produces row-count and exception reports for owner approval.

Keep the original guard semantics in the canonical clean migration. Use a separate, reviewed target-specific migration rather than weakening repository-wide safety.

### Scenario D: partial or drifted remote schema

- Do not rerun all historical migrations.
- Restore the target backup into staging and diff it against the expected schema in [data-dictionary.md](data-dictionary.md).
- Determine exactly which statement/version ran, especially for repaired `00005`, `00006`, and `00008`.
- Write a forward-only reconciliation with explicit preconditions and failure checks.
- Test both the reconciliation and the subsequent `00009` behavior on the restored clone.
- If drift cannot be explained confidently, stop and escalate. A fresh project plus validated data migration may be safer than in-place repair.

## Post-deployment verification

### Structural checks

Confirm all 17 public tables in [data-dictionary.md](data-dictionary.md) exist and inspect null tenant scope:

```sql
SELECT 'customers' AS table_name, count(*) AS null_workshop FROM public.customers WHERE workshop_id IS NULL
UNION ALL SELECT 'vehicles', count(*) FROM public.vehicles WHERE workshop_id IS NULL
UNION ALL SELECT 'work_orders', count(*) FROM public.work_orders WHERE workshop_id IS NULL
UNION ALL SELECT 'line_items', count(*) FROM public.line_items WHERE workshop_id IS NULL
UNION ALL SELECT 'photos', count(*) FROM public.photos WHERE workshop_id IS NULL
UNION ALL SELECT 'payments', count(*) FROM public.payments WHERE workshop_id IS NULL
UNION ALL SELECT 'shop_settings', count(*) FROM public.shop_settings WHERE workshop_id IS NULL
UNION ALL SELECT 'documents', count(*) FROM public.documents WHERE workshop_id IS NULL
UNION ALL SELECT 'activity_logs', count(*) FROM public.activity_logs WHERE workshop_id IS NULL
UNION ALL SELECT 'attachments', count(*) FROM public.attachments WHERE workshop_id IS NULL
UNION ALL SELECT 'notifications', count(*) FROM public.notifications WHERE workshop_id IS NULL
UNION ALL SELECT 'labor_items', count(*) FROM public.labor_items WHERE workshop_id IS NULL
UNION ALL SELECT 'service_packages', count(*) FROM public.service_packages WHERE workshop_id IS NULL
UNION ALL SELECT 'package_items', count(*) FROM public.package_items WHERE workshop_id IS NULL;
```

Every count must be zero.

Check provisioning and settings cardinality:

```sql
SELECT w.id, w.owner_id, w.name,
       count(*) FILTER (WHERE wm.role = 'owner' AND wm.deleted_at IS NULL) AS active_owner_memberships,
       count(*) FILTER (WHERE wm.deleted_at IS NULL) AS active_memberships
FROM public.workshops w
LEFT JOIN public.workshop_members wm ON wm.workshop_id = w.id
WHERE w.deleted_at IS NULL
GROUP BY w.id, w.owner_id, w.name
ORDER BY w.created_at;

SELECT workshop_id, count(*) AS active_settings
FROM public.shop_settings
WHERE deleted_at IS NULL
GROUP BY workshop_id
HAVING count(*) <> 1;
```

Each active workshop should have exactly one active owner membership and one active settings row for the current provisioning model.

Check storage configuration:

```sql
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'attachments';
```

Expected: private, 10,485,760-byte limit, and only `image/jpeg` allowed.

### Role-based integration checks

Use real Supabase clients/sessions, not only the SQL editor's privileged role:

1. Create or identify two users with different workshops.
2. User A creates a customer; User B cannot select or update it.
3. Anonymous access returns no operational rows.
4. User B cannot create a vehicle linked to User A's customer.
5. User A soft-deletes a row; normal SELECT no longer returns it; restore RPC restores it.
6. Attempt invalid work-order transitions and verify rejection; verify accepted transitions create `status_changed` activity logs.
7. Allocate numbers concurrently and verify unique, increasing values within one workshop/day and independent counters across workshops.
8. Upload a PNG or WebP through the application route and verify the stored object is JPEG at a workshop-prefixed path.
9. User A can create a signed read for their path; User B and anonymous clients cannot read it.
10. Verify service-role credentials are absent from browser bundles and network responses.

### Application checks

- Login, callback, default-closed registration, and protected redirects.
- Customer/vehicle/work-order CRUD under an owner session.
- Work-order create/copy number allocation.
- Line-item totals and payment status recalculation, including `overpaid` stored directly.
- Shop-settings owner write and member read behavior.
- Attachment full image/thumbnail upload, metadata creation, signed display, and PDF appendix rules.
- Expected behavior for any migrated legacy photos/objects.

## Rollback and recovery

### If `00009` fails before commit

`00009` is enclosed by `BEGIN`/`COMMIT`. A SQL exception should roll back its PostgreSQL changes. Capture the complete error and verify schema state before retrying.

Do not assume external object-store operations in a surrounding runbook roll back with PostgreSQL. Any storage copy/move must have its own reconciliation log.

### If `00009` commits but validation fails

Preferred response:

1. Keep the database unavailable for normal writes.
2. Preserve workshop IDs and ownership assignments.
3. Diagnose and apply a reviewed forward fix to application behavior, scoped policies, or migrated paths.
4. Never restore the old broad policies that allowed every authenticated user to access every row.

Rolling only the application back can be unsafe: earlier code expects broad access, old storage paths, client-side uploads, missing RPCs, or the retired `jobs` table. Treat application and database versions as one release.

### Full restoration

Use full restore only when the forward-fix path is riskier and the maintenance window permits it:

1. Stop all writes.
2. Preserve forensic copies/logs of the failed state.
3. Restore the verified pre-migration PostgreSQL backup to the correct target.
4. Restore/reconcile Storage objects from the matching snapshot/export.
5. Deploy the application version compatible with that schema.
6. Re-run row counts, authentication, access, financial, and object checks before reopening.

A database restore does not automatically restore Storage bytes, and a Storage restore does not fix metadata. Their backup timestamps and reconciliation must match.

### Why there is no simple `00009` down migration

- Tenant IDs and membership assignments become part of every relationship.
- Composite constraints intentionally prevent cross-workshop links.
- Forced RLS replaces insecure global authenticated policies.
- Work-order numbers become unique per workshop and counters are non-reusable.
- Storage changes from client-writable/public assumptions to a private, server-written model.
- New financial constraints may reject values older code allowed.

Removing those controls is not a safe rollback. Keep tenant assignments and use forward recovery unless restoring the entire pre-change release from verified backups.

## Data-impact checklist

Before approving a production migration, obtain explicit answers for each item:

- Which auth user owns each existing operational row?
- Are there multiple/custom settings rows, and which workshop receives each?
- Do any financial rows fail the new checks?
- Will status conversion in `00006` preserve enough historical meaning for this target?
- Were repaired versions of `00005`, `00006`, and `00008` run, or older copies?
- Which attachment objects lack a workshop UUID path prefix?
- Are there non-JPEG attachment objects or legacy photo objects that must remain accessible?
- Is `SUPABASE_SERVICE_ROLE_KEY` configured only in the server runtime?
- Is sign-up disabled until provisioning is confirmed?
- Can the backup and Storage export be restored within the accepted outage window?
- Are row counts, object counts, file hashes, operator, UTC timestamps, and validation results recorded?

## Test commands and evidence limits

```text
npm run db:test
npm run test:run
npm run typecheck
npm run lint -- --max-warnings=0
npm run build
```

For the 2026-07-26 finalization pass, the clean migration suite passed 9/9 cases and the complete Vitest suite passed 50/50 tests. No live Supabase migration, service-role upload, or production deployment was performed.

PGlite coverage is valuable but limited:

- It uses simplified test definitions for `auth.users`, `storage.buckets`, and `storage.objects`.
- It validates a clean chain, not a drifted or previously partially migrated remote.
- It does not test legacy one-user/multi-user data backfills, large-table locking, object movement, networked PostgREST behavior, or Supabase platform upgrades.
- A live staging rehearsal and role-based integration test remain mandatory before production.
