# RLS Policy Matrix

## Scope and confidence

This matrix describes the schema produced by applying every repository migration in lexical order through `src/db/migrations/00009_phase0_tenant_security.sql`. It is a description of the checked-in SQL, not a statement that any hosted Supabase project has these policies.

Migration `00009` removes the permissive public-table policies from migrations `00001` through `00008`, enables and forces RLS on all 17 resulting public tables, and creates the policies listed below. The successful 9-case PGlite run on 2026-07-26 proves that the clean migration chain and selected policy behavior work in the test harness. It does not prove migration history, grants, JWT behavior, Storage API behavior, or policy state in hosted Supabase.

Policy eligibility and SQL grants are separate. The matrix assumes Supabase's intended `authenticated` grants. A deployment must inspect both `pg_policies` and role grants.

## Condition key

| Key         | SQL meaning                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| `member(w)` | `public.is_workshop_member(w)` for the current `auth.uid()`, with an active membership                  |
| `owner(w)`  | `public.is_workshop_owner(w)` for the current `auth.uid()`, with an active owner membership             |
| `current`   | `public.current_workshop_id()`; one active membership, owner first, then oldest membership              |
| `active`    | `deleted_at IS NULL`                                                                                    |
| Denied      | No policy exists for the role and operation; RLS therefore rejects it when normal Supabase grants apply |

All policies below target `authenticated`. There are no `anon` public-table policies. `service_role` is deliberately not a browser role and normally bypasses RLS.

| Role            | Baseline behavior                                                                                                         | Test evidence                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `anon`          | No application-table or attachment-object policy applies, so direct access is denied when normal grants/RLS are in effect | Customer `SELECT` and `INSERT` denial are exercised                                         |
| `authenticated` | Eligible only through the resource/operation policies below                                                               | Representative customer, vehicle-parent, attachment, and Storage cases                     |
| `service_role`  | Bypasses RLS; intended only for tightly scoped server/operations use                                                      | PGlite creates a BYPASSRLS role, but the application upload path is not integration-tested |

## Test evidence key

| Key          | Evidence in `src/db/tests/migrations.test.ts`                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Chain`      | All migrations execute in a fresh PGlite database; at least 16 public `*_select` policies exist. This is structural evidence, not a per-operation assertion. |
| `Customer`   | Owner A inserts and reads a customer; owner B cannot select or update it; owner A soft-deletes/restores it; active-row reads hide deletion.                  |
| `FK/anon`    | Owner B cannot attach a vehicle to owner A's customer; `anon` cannot read or insert customers.                                                                |
| `Attachment` | Owner/private/member/cross-tenant reads, private insert denial, path-parent binding, duplicate-path denial, and Storage object isolation are exercised.       |
| `Bucket`     | The `attachments` bucket is asserted private with a 10 MiB limit.                                                                                            |
| `Lifecycle`  | Direct soft deletion is denied; parent/child soft delete and ordered restoration are exercised.                                                              |
| `Work order` | Atomic create/update/copy, status transition, stale version, direct insert, immutable number, derived financial state, and tenant counters are exercised.   |
| `Not direct` | The clean chain creates the policy, but no test exercises this exact table and operation.                                                                    |

## Ownership tables

| Resource           | Operation | Role            | Policy condition                                                                                                                        | Test                                                             |
| ------------------ | --------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `workshops`        | `SELECT`  | `authenticated` | `member(id) AND active`                                                                                                                 | Indirectly needed by provisioning/helpers; not directly asserted |
| `workshops`        | `INSERT`  | `authenticated` | Denied. New-user provisioning occurs through `handle_new_auth_user()`, not a client policy.                                             | Not direct                                                       |
| `workshops`        | `UPDATE`  | `authenticated` | Active owner row only; trigger makes `owner_id` immutable                                                                               | Not direct                                                       |
| `workshops`        | `DELETE`  | `authenticated` | Denied                                                                                                                                  | Not direct                                                       |
| `workshop_members` | `SELECT`  | `authenticated` | Own membership row, including a deleted own row, or any row in a workshop the caller owns: `user_id = auth.uid() OR owner(workshop_id)` | Not direct                                                       |
| `workshop_members` | `INSERT`  | `authenticated` | `owner(workshop_id)`                                                                                                                    | Not direct                                                       |
| `workshop_members` | `UPDATE`  | `authenticated` | `USING owner(workshop_id)` and `WITH CHECK owner(workshop_id)`                                                                          | Not direct                                                       |
| `workshop_members` | `DELETE`  | `authenticated` | Denied; membership removal is represented by an owner update to `deleted_at`                                                            | Not direct                                                       |

`workshops.owner_id` is unique, and `workshop_members_one_active_owner` permits one active owner membership per workshop. A trigger prevents changing the owner identity, demoting/deleting the owner membership, or assigning the owner role to a different user. The repository contains no membership administration UI or browser test.

## Tenant business tables

The repeated policy shape comes from the dynamic policy block in migration `00009`:

- `SELECT`: caller is a member of the row workshop and the row is active.
- `INSERT`: caller is a member, the supplied/defaulted `workshop_id` equals `current`, and the row is active.
- `UPDATE`: the existing and resulting row are active, in a member workshop, and remain in `current`. Soft delete/restore uses allowlisted RPCs.
- Hard `DELETE`: denied.
- `enforce_workshop_scope()` also prevents changing `workshop_id` and rejects inserts outside membership.

| Resource           | Operation | Role            | Policy condition                                                                                                             | Test                                                                |
| ------------------ | --------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `customers`        | `SELECT`  | `authenticated` | `member(workshop_id) AND active`                                                                                             | `Customer`; `FK/anon` covers anonymous denial                       |
| `customers`        | `INSERT`  | `authenticated` | `member(workshop_id) AND workshop_id = current`                                                                              | `Customer`                                                          |
| `customers`        | `UPDATE`  | `authenticated` | `USING member(workshop_id)`; `WITH CHECK member(workshop_id) AND workshop_id = current`                                      | `Customer` covers cross-workshop no-op                              |
| `customers`        | `DELETE`  | `authenticated` | Denied; use the soft-delete RPC                                                                                              | `Customer` covers the RPC, not hard delete                          |
| `vehicles`         | `SELECT`  | `authenticated` | `member(workshop_id) AND active`                                                                                             | Indirect own-row use; cross-workshop SELECT not direct              |
| `vehicles`         | `INSERT`  | `authenticated` | `member(workshop_id) AND workshop_id = current`                                                                              | `FK/anon` and `Attachment`; composite customer FK is also exercised |
| `vehicles`         | `UPDATE`  | `authenticated` | `USING member(workshop_id)`; matching member/current `WITH CHECK`                                                            | Not direct                                                          |
| `vehicles`         | `DELETE`  | `authenticated` | Denied; use the soft-delete RPC                                                                                              | Not direct                                                          |
| `work_orders`      | `SELECT`  | `authenticated` | `member(workshop_id) AND active`                                                                                             | Chain only                                                          |
| `work_orders`      | `INSERT`  | `authenticated` | Denied; use `create_work_order_with_items()` or copy RPC so number allocation is atomic                                      | `Work order`                                                        |
| `work_orders`      | `UPDATE`  | `authenticated` | Active member/current row; status, immutable number, version, and derived payment triggers also apply                        | `Work order`                                                        |
| `work_orders`      | `DELETE`  | `authenticated` | Denied; use the soft-delete RPC                                                                                              | Not direct                                                          |
| `line_items`       | `SELECT`  | `authenticated` | `member(workshop_id) AND active` plus an active same-workshop work-order parent                                              | `Lifecycle`; financial insert is also exercised                    |
| `line_items`       | `INSERT`  | `authenticated` | `member(workshop_id) AND workshop_id = current`                                                                              | Chain only                                                          |
| `line_items`       | `UPDATE`  | `authenticated` | `USING member(workshop_id)`; matching member/current `WITH CHECK`                                                            | Chain only                                                          |
| `line_items`       | `DELETE`  | `authenticated` | Denied; use the soft-delete RPC                                                                                              | Not direct                                                          |
| `photos`           | `SELECT`  | `authenticated` | `member(workshop_id) AND active`                                                                                             | Chain only; this is the retained legacy table                       |
| `photos`           | `INSERT`  | `authenticated` | `member(workshop_id) AND workshop_id = current`                                                                              | Chain only                                                          |
| `photos`           | `UPDATE`  | `authenticated` | `USING member(workshop_id)`; matching member/current `WITH CHECK`                                                            | Chain only                                                          |
| `photos`           | `DELETE`  | `authenticated` | Denied; use the soft-delete RPC                                                                                              | Not direct                                                          |
| `payments`         | `SELECT`  | `authenticated` | `member(workshop_id) AND active` plus an active same-workshop work-order parent                                              | `Work order`                                                        |
| `payments`         | `INSERT`  | `authenticated` | `member(workshop_id) AND workshop_id = current`                                                                              | Chain only                                                          |
| `payments`         | `UPDATE`  | `authenticated` | `USING member(workshop_id)`; matching member/current `WITH CHECK`                                                            | Chain only                                                          |
| `payments`         | `DELETE`  | `authenticated` | Denied; use the soft-delete RPC                                                                                              | Not direct                                                          |
| `documents`        | `SELECT`  | `authenticated` | `member(workshop_id) AND active` plus an active same-workshop work-order parent                                              | Chain only                                                          |
| `documents`        | `INSERT`  | `authenticated` | `member(workshop_id) AND workshop_id = current`                                                                              | Chain only                                                          |
| `documents`        | `UPDATE`  | `authenticated` | `USING member(workshop_id)`; matching member/current `WITH CHECK`                                                            | Chain only                                                          |
| `documents`        | `DELETE`  | `authenticated` | Denied; use the soft-delete RPC                                                                                              | Not direct                                                          |
| `attachments`      | `SELECT`  | `authenticated` | Active member and parent; private rows additionally require `owner(workshop_id)`                                             | `Attachment`                                                        |
| `attachments`      | `INSERT`  | `authenticated` | Active member/current row and active parent; private rows require owner; path trigger binds object key to parent             | `Attachment`                                                        |
| `attachments`      | `UPDATE`  | `authenticated` | Same active-parent/visibility conditions for existing and resulting rows; scope/path triggers also run                       | `Attachment` covers insert boundaries                               |
| `attachments`      | `DELETE`  | `authenticated` | Denied; use the soft-delete RPC                                                                                              | Not direct                                                          |
| `notifications`    | `SELECT`  | `authenticated` | Active member row; when linked, the work order must also be active in the same workshop                                      | Chain only                                                          |
| `notifications`    | `INSERT`  | `authenticated` | `member(workshop_id) AND workshop_id = current`                                                                              | Chain only                                                          |
| `notifications`    | `UPDATE`  | `authenticated` | `USING member(workshop_id)`; matching member/current `WITH CHECK`                                                            | Chain only                                                          |
| `notifications`    | `DELETE`  | `authenticated` | Denied; use the soft-delete RPC                                                                                              | Not direct                                                          |
| `labor_items`      | `SELECT`  | `authenticated` | `member(workshop_id) AND active`                                                                                             | Chain only                                                          |
| `labor_items`      | `INSERT`  | `authenticated` | `member(workshop_id) AND workshop_id = current`                                                                              | Chain only                                                          |
| `labor_items`      | `UPDATE`  | `authenticated` | `USING member(workshop_id)`; matching member/current `WITH CHECK`                                                            | Chain only                                                          |
| `labor_items`      | `DELETE`  | `authenticated` | Denied; use the soft-delete RPC                                                                                              | Not direct                                                          |
| `service_packages` | `SELECT`  | `authenticated` | `member(workshop_id) AND active`                                                                                             | Chain only                                                          |
| `service_packages` | `INSERT`  | `authenticated` | `member(workshop_id) AND workshop_id = current`                                                                              | Chain only                                                          |
| `service_packages` | `UPDATE`  | `authenticated` | `USING member(workshop_id)`; matching member/current `WITH CHECK`                                                            | Chain only                                                          |
| `service_packages` | `DELETE`  | `authenticated` | Denied; use the soft-delete RPC                                                                                              | Not direct                                                          |
| `package_items`    | `SELECT`  | `authenticated` | Active member row plus active same-workshop package parent                                                                  | Chain only                                                          |
| `package_items`    | `INSERT`  | `authenticated` | `member(workshop_id) AND workshop_id = current`                                                                              | Chain only                                                          |
| `package_items`    | `UPDATE`  | `authenticated` | `USING member(workshop_id)`; matching member/current `WITH CHECK`                                                            | Chain only                                                          |
| `package_items`    | `DELETE`  | `authenticated` | Denied; package replacement uses `soft_delete_package_items()`                                                               | Not direct                                                          |

Composite foreign keys in migration `00009` additionally constrain customer-to-vehicle, vehicle/customer/linked-order-to-work-order, order children, and package children to one workshop. The polymorphic attachment parent uses a trigger instead of a foreign key. The legacy `photos` parent relationships do not receive equivalent composite parent constraints in `00009`.

## Special tables and RPC paths

| Resource                          | Operation                                   | Role            | Condition                                                                                                                  | Test                                                                          |
| --------------------------------- | ------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `shop_settings`                   | `SELECT`                                    | `authenticated` | `member(workshop_id) AND active`                                                                                           | Chain only                                                                    |
| `shop_settings`                   | `INSERT`                                    | `authenticated` | `owner(workshop_id) AND workshop_id = current`                                                                             | Provisioning is indirect; policy not direct                                   |
| `shop_settings`                   | `UPDATE`                                    | `authenticated` | Active owner row; active owner/current `WITH CHECK`                                                                        | Not direct                                                                    |
| `shop_settings`                   | `DELETE`                                    | `authenticated` | Denied; table is allowlisted for the soft-delete/restore RPCs                                                              | Not direct                                                                    |
| `activity_logs`                   | `SELECT`                                    | `authenticated` | `member(workshop_id)`; there is no `deleted_at` column                                                                     | Chain only                                                                    |
| `activity_logs`                   | `INSERT`                                    | `authenticated` | `member(workshop_id) AND workshop_id = current`                                                                            | Chain only                                                                    |
| `activity_logs`                   | `UPDATE`                                    | `authenticated` | Denied                                                                                                                     | Not direct                                                                    |
| `activity_logs`                   | `DELETE`                                    | `authenticated` | Denied                                                                                                                     | Not direct                                                                    |
| `work_order_number_counters`      | Direct `SELECT`                             | `authenticated` | Denied; RLS is forced and no direct policy exists                                                                          | Object creation only                                                          |
| `work_order_number_counters`      | Direct `INSERT`                             | `authenticated` | Denied; RLS is forced and no direct policy exists                                                                          | Not direct                                                                    |
| `work_order_number_counters`      | Direct `UPDATE`                             | `authenticated` | Denied; RLS is forced and no direct policy exists                                                                          | Not direct                                                                    |
| `work_order_number_counters`      | Direct `DELETE`                             | `authenticated` | Denied; RLS is forced and no direct policy exists                                                                          | Not direct                                                                    |
| `work_order_number_counters`      | Allocate through `next_work_order_number()` | `authenticated` | Security-definer RPC requires a non-null target workshop and `member(target_workshop_id)`                                  | `Work order`: format, concurrency, and tenant counter separation              |
| Allowlisted soft-deletable tables | `soft_delete_record(table, id)`             | `authenticated` | Allowlisted active current-workshop row; parent deletes are blocked while active operational dependents exist             | `Customer`; `Lifecycle`                                                       |
| Allowlisted soft-deletable tables | `restore_record(table, id)`                 | `authenticated` | Same allowlist/workshop check; active-parent triggers must pass                                                            | `Customer`; `Lifecycle`                                                       |
| `package_items`                   | `soft_delete_package_items(package_id)`     | `authenticated` | Package must be active in `current`; matching active children are updated                                                  | Not direct                                                                    |

The RPC allowlist covers `customers`, `vehicles`, `work_orders`, `line_items`, `photos`, `payments`, `shop_settings`, `documents`, `attachments`, `notifications`, `labor_items`, `service_packages`, and `package_items`. It intentionally excludes `workshops`, `workshop_members`, `activity_logs`, and counters.

## Storage

Migration `00009` provisions one bucket used by current application code:

| Property                  | Repository value          | Test                                    |
| ------------------------- | ------------------------- | --------------------------------------- |
| Bucket                    | `attachments`             | `Bucket`                                |
| Public                    | `false`                   | `Bucket`                                |
| File-size limit           | `10,485,760` bytes        | `Bucket`                                |
| Allowed bucket MIME types | `image/jpeg`              | Created by chain; not directly asserted |
| Object key convention     | `<workshop UUID>/<parent type>/<parent UUID>/<name>.jpg` | Representative vehicle key in `Attachment`; parent types are customer, vehicle, work order, and line item |

| Resource                                | Operation                              | Role            | Policy or application condition                                                                                                                                                                                                              | Test                                                                                |
| --------------------------------------- | -------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `storage.objects`, bucket `attachments` | `SELECT` and signed-read authorization | `authenticated` | Bucket/workshop match; active metadata references the exact object path; active parent and metadata visibility RLS apply                                                                                                                      | `Attachment` proves owner/member/private and cross-workshop behavior in PGlite      |
| `storage.objects`, bucket `attachments` | Direct `INSERT`                        | `authenticated` | Denied; no browser insert policy                                                                                                                                                                                                             | Policy absence only                                                                 |
| `storage.objects`, bucket `attachments` | Direct `UPDATE`                        | `authenticated` | Denied; no browser update policy                                                                                                                                                                                                             | Policy absence only                                                                 |
| `storage.objects`, bucket `attachments` | Direct `DELETE`                        | `authenticated` | Denied; no browser delete policy                                                                                                                                                                                                             | Policy absence only                                                                 |
| `storage.objects`, bucket `attachments` | Server upload                          | `service_role`  | Route checks exact origin, session, rate limit, active parent through user RLS, current workshop, path shape, processed body `<= 4 MiB`, MIME, decoded format, and 40 MP input before upload                                              | No hosted Storage integration test                                                   |

Current signed-URL lifetimes are 1 hour for normal viewing, 24 hours for explicit download, and 2 hours for PDF photo preparation. An issued signed URL is a bearer capability until expiry; RLS is checked when it is created, not on every byte request.

Migration `00009` drops four legacy `photos` object policies but does not remove a pre-existing `photos` bucket or force that bucket private. Migration `00003` only commented an optional public-bucket insert. Every deployed project must inspect and retire or privatize any legacy bucket separately.

## Known authorization gaps and release checks

- `private` attachment metadata/objects require the workshop owner. `workshop` and `customer` are both active-member readable; there is no public/customer portal role yet.
- `owner` and `member` are not differentiated for most business tables. Any active member can read and update payments, customer PII, internal notes, and attachment metadata in that workshop.
- A user may have multiple memberships, but writes require the one workshop returned by `current_workshop_id()`; there is no workshop switcher. Reads can span all active memberships.
- There are no hard-delete policies, but privileged/service-role operations can bypass RLS and must have separate controls.
- PGlite stubs `auth` and `storage`; hosted Supabase must be tested with real JWTs, API grants, Storage signed URLs, and two isolated users.
- The tests exercise representative tenant, anonymous, lifecycle, financial, work-order, attachment, Storage, and foreign-key behavior. They are not exhaustive per-table CRUD tests.
- Query the live `pg_policies`, `pg_tables.rowsecurity`, `pg_tables.forcerowsecurity`, role grants, functions, triggers, and bucket settings after migration. Do not infer deployment state from this file.

See also [security-threat-model.md](security-threat-model.md), [testing-strategy.md](testing-strategy.md), and [deployment.md](deployment.md).
