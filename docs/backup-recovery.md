# Backup and Recovery

## Current status

The repository contains no backup script, scheduled backup workflow, object export, retention job, restore automation, restore test, or checked-in Supabase project configuration. Hosted Supabase backup/PITR availability and retention depend on the selected project and plan and were not inspected.

No backup or restore was executed during this documentation work. The runbook below is the required operating procedure to implement and validate; it is not evidence that recovery works today.

## Recovery objectives

Business owners must approve objectives based on acceptable record and evidence loss. Until then, use these as provisional planning targets, not an SLA:

| Objective             |                                             Provisional target | Current evidence                   |
| --------------------- | -------------------------------------------------------------: | ---------------------------------- |
| Database RPO          |                          24 hours, plus a pre-migration backup | No automated backup evidence       |
| Attachment-object RPO |               24 hours and time-aligned with database metadata | No object export/snapshot evidence |
| RTO                   |                             8 hours for a full service restore | No timed restore drill             |
| Restore drill         |                     Quarterly and before a high-risk migration | No drill history                   |
| Backup retention      | 35 daily, 12 monthly, subject to approved privacy/legal policy | No configured retention            |

Financial or safety requirements may require lower RPO/RTO. Do not lower a stated target without a tested mechanism.

## What must be recoverable

| Backup set            | Content                                                                                           | Why it is separate                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| PostgreSQL            | `public` schema data/objects, Auth identity references, Storage metadata, migration/catalog state | Public rows reference `auth.users`; metadata alone does not include file bytes |
| Storage bytes         | Every object in active `attachments` and any retained legacy `photos` bucket                      | Database backups do not contain object bytes                                   |
| Application release   | Git commit, lockfile, migration file hashes, Node/Next versions, deploy artifact identifier       | Restored data must run with a compatible application/schema                    |
| Auth configuration    | Signup mode, providers, redirect URLs, email templates, password/MFA/session settings             | These are provider configuration, not application rows                         |
| Runtime configuration | Variable names, secret references/versions, canonical URL, regions                                | Secrets belong in a secret manager, not the backup manifest itself             |
| Operations metadata   | UTC start/end, project reference, operator, tool versions, checksums, row/object counts, result   | Required to choose and validate a recovery point                               |

The database and object snapshot must share a consistency marker or documented time window. A metadata row restored without its object is broken; an object restored without metadata is orphaned.

## Backup controls

- Encrypt backups in transit and at rest with keys separate from the backup location.
- Limit read/restore permission to named operators; log access and test revocation.
- Store at least one copy outside the primary Supabase project/account failure domain.
- Treat dumps and images as production PII. Do not attach them to tickets, CI artifacts, or developer workstations.
- Use immutable/versioned storage or object lock where available.
- Verify checksums, non-zero file/object counts, and completion status after each run.
- Alert on missed schedule, duration anomaly, size anomaly, checksum failure, or retention failure.
- Rotate database/service credentials after suspected exposure; never embed them in commands retained by shared shell history.

## Backup procedure

### 1. Identify and freeze

1. Confirm environment, Supabase project reference, database host/region, application commit, and operator.
2. For a migration backup, stop writes and signup. For scheduled online backup, record that writes continued and rely only on a provider-consistent snapshot mechanism.
3. Record UTC start time and the newest relevant row/object timestamps.

### 2. Prefer managed full-project recovery where available

Verify in the Supabase dashboard and plan documentation:

- Automated backup schedule and retention.
- Point-in-time recovery availability and granularity.
- Whether Auth and Storage metadata are included.
- How restoration targets a new project or rewinds the existing one.
- Region, encryption, access, and restore-time expectations.

Capture configuration evidence without including credentials or customer data. A dashboard indicator is not enough; complete a restore drill.

### 3. Create a portable public-schema export

The installed Supabase CLI supports `db dump`, but this repository is not linked and has no `supabase/config.toml`. Use an explicitly identified, percent-encoded direct database URL from a protected environment. Example commands use placeholders deliberately:

```sh
npx supabase db dump --db-url "<percent-encoded-direct-database-url>" --schema public -f "<secure-backup-path>/public-schema.sql"
npx supabase db dump --db-url "<percent-encoded-direct-database-url>" --schema public --data-only --use-copy -f "<secure-backup-path>/public-data.sql"
npx supabase db dump --db-url "<percent-encoded-direct-database-url>" --role-only -f "<secure-backup-path>/roles.sql"
```

The role dump is inventory. Do not blindly apply managed Supabase roles to another project. An explicit `public` export is portable application coverage, not a full Supabase project backup; it does not capture Auth configuration or Storage bytes and may not be sufficient to rebuild identity relationships by itself.

Run `npx supabase db dump --help` for the installed CLI syntax before an incident. Record CLI/PostgreSQL versions and stderr. If the command requires Docker or network access in the chosen runner, prove that in the scheduled job before relying on it.

### 4. Export attachment bytes

Implement a server-side export using a restricted service credential or provider-supported bucket replication. The exporter must:

1. Enumerate every object in the private `attachments` bucket and any retained legacy bucket.
2. Preserve the exact object key, including `<workshop UUID>/...` prefix.
3. Stream bytes to encrypted backup storage without public URLs.
4. Record object key, bucket, byte size, MIME, provider version/ETag when meaningful, and SHA-256 computed from exported bytes.
5. Compare exported object count/bytes with source inventory and report retries/failures.
6. Avoid logging signed URLs, filenames containing PII, or image contents.

There is no such exporter in the current repository. Until it exists and succeeds, the backup is incomplete.

### 5. Create the manifest

The backup manifest should contain non-secret operational metadata:

```text
backup_id
environment and Supabase project reference
UTC start/end and consistency point
application commit and migration file hashes
Node, Supabase CLI, pg_dump/provider versions
database export names, sizes, SHA-256 values
bucket/object counts and total bytes
failed/skipped object count
encryption key reference, not key material
operator and verification result
```

On Windows, an operator can generate a file checksum with:

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath "<backup-file>"
```

### 6. Verify and retain

- Fail the job if any required dump/object/manifest is absent, empty, or unchecked.
- Compare per-table row counts and per-bucket object counts to the recorded inventory.
- Apply the approved daily/monthly retention policy only after the new set is verified.
- Do not delete the last known-good set when a new backup fails.

## Restore procedure

### 1. Declare the incident

1. Stop writes, uploads, signup, scheduled jobs, and outbound notifications.
2. Record incident time, suspected corruption/security boundary, and last trusted operation.
3. Preserve logs and a forensic snapshot of the failed state without exposing PII.
4. Choose a recovery point whose database and object backup align.

### 2. Restore into isolation first

Use a new/disposable target or isolated database, not the active production target. Prefer the provider's supported full-project/PITR process because it can preserve managed Auth and Storage metadata coherently.

If using portable exports, do not improvise a production import. Public rows contain foreign keys to Auth user UUIDs, and migration `00009` installs an Auth-user trigger that creates workshops/settings. Restoring identities and then importing dumped workshop rows can conflict unless the sequence is explicitly designed. The repository does not contain that reconciliation script.

A portable restore plan must define:

- How original Auth user UUIDs and provider identities are recovered or remapped.
- Whether schema comes from the dump or migrations; never apply both blindly.
- How provisioning triggers are handled without duplicate workshops/settings.
- How `created_by`, `updated_by`, ownership, and memberships preserve attribution.
- How object metadata and bytes retain exact keys.

### 3. Restore Storage bytes

Import through a provider-supported private/admin API using the original bucket and key. Keep the bucket private, preserve `image/jpeg`, and do not create temporary public access. Compare every restored byte checksum to the backup manifest.

### 4. Validate before cutover

| Area        | Required check                                                                                        |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| Schema      | Expected 17 public tables, functions, triggers, constraints, indexes, forced RLS, and scoped policies |
| Ownership   | No null workshop scope; one intended owner and settings row per active workshop                       |
| Counts      | Per-table and per-workshop counts match the selected backup, with explained exceptions                |
| Financial   | Sample totals/payments and constraint validation match source records                                 |
| Numbering   | Existing references unchanged; next allocation does not collide or reuse                              |
| Auth/RLS    | Two real users and anon exercise the policy matrix without service role                               |
| Storage     | Bucket private; count/bytes/checksums match; own signed reads work; cross-workshop reads fail         |
| Application | Login, key CRUD, soft delete/restore, status, upload, gallery, and PDF smoke pass                     |
| Security    | No production secret or user traffic reached the isolated target during validation                    |

### 5. Cut over

1. Approve validation with the incident owner and data owner.
2. Deploy the application release compatible with the restored schema.
3. Point traffic to the restored target using controlled secret/config changes.
4. Re-run smoke and access checks from the production edge.
5. Resume writes gradually and monitor errors, auth, database, object reads, and number allocation.
6. Keep the failed environment and recovery artifacts under incident retention until review completes.

## Migration recovery

Before applying `00009` or a target-specific reconciliation, follow `docs/migration-guide.md`. Its transaction can roll back PostgreSQL statements when it fails before commit, but external object moves cannot participate in that transaction.

After a committed security migration, prefer a reviewed forward fix. Do not restore old broad authenticated policies. Roll back the whole compatible release only from a verified database and object backup when forward repair is riskier.

## Restore drill

Run at least quarterly and before a high-risk production migration:

1. Select a recent backup without changing it.
2. Restore to a disposable isolated target.
3. Time each phase and record actual RPO/RTO.
4. Execute all validation rows above, including two-user RLS and attachment checks.
5. Confirm that operators can obtain required credentials during an incident without bypassing access policy.
6. Destroy the temporary target and sensitive local artifacts under the approved disposal process.
7. File gaps with owners and due dates; update this runbook only from proven steps.

## Current blockers

- Hosted backup/PITR plan and retention are unknown.
- No scheduled job or alert exists in `.github/workflows/` or elsewhere in the repository.
- No Storage byte exporter/importer or checksum manifest exists.
- No reviewed Auth/public-schema reconciliation sequence exists for portable restore.
- No restore drill, measured RPO/RTO, or operator evidence exists.
- Soft-deleted attachment metadata intentionally retains objects, but no retention/purge policy is implemented.
- Legacy `photos` table/bucket disposition is unresolved.

Production readiness requires closing these blockers or explicitly accepting the inability to meet the approved recovery objective.
