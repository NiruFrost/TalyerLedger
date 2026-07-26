# Data Dictionary

## Scope

This dictionary describes the final public schema produced by repository migrations `00001` through `00009`. It includes every current public table and its persisted columns, plus the Supabase-owned tables and database functions on which the application depends.

It is a repository baseline, not a dump of a live Supabase project. Migration `00009` has PGlite test coverage but was not applied to a live project in this documentation session.

## Conventions

| Convention                 | Meaning                                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| `UUID` identifiers         | Generated with `gen_random_uuid()` unless the table uses a composite key.                                 |
| `workshop_id`              | Non-null tenant scope, normally defaulted by `current_workshop_id()` and protected by scope trigger/RLS.  |
| `created_at`               | Creation timestamp, normally non-null with `now()`.                                                       |
| `updated_at`               | Last-update timestamp maintained by `update_updated_at()` where present.                                  |
| `created_by`, `updated_by` | Nullable references to `auth.users(id)` with `ON DELETE SET NULL`; authenticated writes use `auth.uid()`. |
| `deleted_at`               | Nullable soft-delete timestamp; `NULL` means active. Standard SELECT policies expose active rows only.    |
| Money                      | PostgreSQL `NUMERIC`, never floating point. Application calculations round to cents.                      |

## Tenancy and access

### `workshops`

Tenant root. A user can own at most one workshop.

| Column       | Type and constraints                                               | Meaning                                               |
| ------------ | ------------------------------------------------------------------ | ----------------------------------------------------- |
| `id`         | `UUID` PK, default `gen_random_uuid()`                             | Workshop identifier.                                  |
| `owner_id`   | `UUID` NN, FK to `auth.users`, `ON DELETE RESTRICT`, unique        | Auth user who owns the workshop.                      |
| `name`       | `TEXT` NN, default `My Workshop`, trimmed length greater than zero | Display name.                                         |
| `timezone`   | `TEXT` NN, default `Asia/Manila`                                   | PostgreSQL timezone used for daily number allocation. |
| `created_at` | `TIMESTAMPTZ` NN, default `now()`                                  | Creation time.                                        |
| `updated_at` | `TIMESTAMPTZ` NN, default `now()`                                  | Last update time.                                     |
| `created_by` | `UUID`, FK to `auth.users`, `ON DELETE SET NULL`                   | Creating actor.                                       |
| `updated_by` | `UUID`, FK to `auth.users`, `ON DELETE SET NULL`                   | Last updating actor.                                  |
| `deleted_at` | `TIMESTAMPTZ`                                                      | Soft-delete marker.                                   |

Key rules: members can read active workshops; only an active owner can update one. Client insert/delete policies are absent. The auth-user trigger provisions rows.

### `workshop_members`

Associates an auth user with a workshop.

| Column        | Type and constraints                                             | Meaning                                                                      |
| ------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `workshop_id` | `UUID` NN, FK to `workshops`, `ON DELETE RESTRICT`, composite PK | Workshop membership belongs to.                                              |
| `user_id`     | `UUID` NN, FK to `auth.users`, `ON DELETE CASCADE`, composite PK | Member auth user.                                                            |
| `role`        | `TEXT` NN, default `owner`, check `owner` or `member`            | Membership role.                                                             |
| `created_at`  | `TIMESTAMPTZ` NN, default `now()`                                | Membership creation time.                                                    |
| `updated_at`  | `TIMESTAMPTZ` NN, default `now()`                                | Last update time.                                                            |
| `created_by`  | `UUID`, FK to `auth.users`, `ON DELETE SET NULL`                 | Creating actor.                                                              |
| `updated_by`  | `UUID`, FK to `auth.users`, `ON DELETE SET NULL`                 | Last updating actor.                                                         |
| `deleted_at`  | `TIMESTAMPTZ`                                                    | Inactive membership marker. Membership helper functions ignore deleted rows. |

Key rules: primary key is `(workshop_id, user_id)`; a partial unique index allows one active `owner` per workshop. A user can see their own membership or memberships in a workshop they own. Owners can insert/update memberships. There is no current membership-management UI.

## Customers and vehicles

### `customers`

Customer/contact record.

| Column        | Type and constraints                                   | Meaning                                                                                          |
| ------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `id`          | `UUID` PK, default `gen_random_uuid()`                 | Customer identifier.                                                                             |
| `workshop_id` | `UUID` NN, FK to `workshops`, default current workshop | Tenant scope. `(workshop_id, id)` is also unique for composite child FKs.                        |
| `name`        | `TEXT` NN                                              | Customer display name. The UI trims and limits it to 160 characters; the DB has no length check. |
| `email`       | `TEXT`                                                 | Optional email.                                                                                  |
| `phone`       | `TEXT`                                                 | Optional phone.                                                                                  |
| `address`     | `TEXT`                                                 | Optional postal/location text.                                                                   |
| `notes`       | `TEXT`                                                 | Optional internal/customer notes.                                                                |
| `created_at`  | `TIMESTAMPTZ` NN, default `now()`                      | Creation time.                                                                                   |
| `updated_at`  | `TIMESTAMPTZ` NN, default `now()`                      | Last update time.                                                                                |
| `created_by`  | `UUID`, FK to `auth.users`                             | Creating actor.                                                                                  |
| `updated_by`  | `UUID`, FK to `auth.users`                             | Last updating actor.                                                                             |
| `deleted_at`  | `TIMESTAMPTZ`                                          | Soft-delete marker.                                                                              |

### `vehicles`

Vehicle serviced by a workshop, optionally associated with a customer.

| Column         | Type and constraints                                                  | Meaning                                                                                                             |
| -------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `id`           | `UUID` PK, default `gen_random_uuid()`                                | Vehicle identifier.                                                                                                 |
| `workshop_id`  | `UUID` NN, FK to `workshops`, default current workshop                | Tenant scope. `(workshop_id, id)` is unique.                                                                        |
| `customer_id`  | `UUID`, FK to `customers(id)` and composite FK to `(workshop_id, id)` | Optional customer in the same workshop. The composite FK uses `ON DELETE RESTRICT`; application deletion is soft.   |
| `make`         | `TEXT` NN                                                             | Manufacturer.                                                                                                       |
| `model`        | `TEXT` NN                                                             | Model.                                                                                                              |
| `year`         | `INTEGER` NN                                                          | Model year. UI accepts 1900 through 2030; DB has no range check.                                                    |
| `engine`       | `TEXT`                                                                | Engine description.                                                                                                 |
| `transmission` | `TEXT`                                                                | Transmission description.                                                                                           |
| `vin`          | `TEXT`                                                                | VIN or serial-like identifier; not unique.                                                                          |
| `plate`        | `TEXT`                                                                | Registration/plate; not unique.                                                                                     |
| `color`        | `TEXT`                                                                | Vehicle color.                                                                                                      |
| `cover_photo`  | `TEXT`                                                                | Legacy/free-form cover reference. It is not a foreign key. Current attachment code may store an attachment ID here. |
| `notes`        | `TEXT`                                                                | Optional notes.                                                                                                     |
| `created_at`   | `TIMESTAMPTZ` NN, default `now()`                                     | Creation time.                                                                                                      |
| `updated_at`   | `TIMESTAMPTZ` NN, default `now()`                                     | Last update time.                                                                                                   |
| `created_by`   | `UUID`, FK to `auth.users`                                            | Creating actor.                                                                                                     |
| `updated_by`   | `UUID`, FK to `auth.users`                                            | Last updating actor.                                                                                                |
| `deleted_at`   | `TIMESTAMPTZ`                                                         | Soft-delete marker.                                                                                                 |

## Work execution

### `work_orders`

Permanent operational record. The table was named `jobs` before migration `00005`; browser routes still use `/jobs`.

| Column                        | Type and constraints                                                          | Meaning                                                                                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                          | `UUID` PK, default `gen_random_uuid()`                                        | Work-order identifier.                                                                                                                         |
| `workshop_id`                 | `UUID` NN, FK to `workshops`, default current workshop                        | Tenant scope. `(workshop_id, id)` is unique.                                                                                                   |
| `estimate_no`                 | `TEXT` NN, unique per `(workshop_id, estimate_no)`                            | Permanent human-facing number allocated by RPC. New values follow `YY-MMDD-000001`; a trigger makes the value immutable.                      |
| `vehicle_id`                  | `UUID` NN, FK to `vehicles`, composite same-workshop FK, `ON DELETE RESTRICT` | Required serviced vehicle.                                                                                                                     |
| `customer_id`                 | `UUID`, FK to `customers`, composite same-workshop FK                         | Optional customer snapshot link.                                                                                                               |
| `status`                      | `work_order_status` NN, default `draft`                                       | Repair/workflow status. Database transitions are trigger-controlled.                                                                           |
| `payment_status`              | `TEXT` NN, default `unpaid`, check `unpaid/partial/paid/overpaid`             | Persisted derived status recalculated by database triggers; authenticated direct writes are rejected.                                          |
| `version`                     | `INTEGER` NN, default `1`, check greater than zero                            | Incremented on every update and checked by the atomic update RPC to detect stale writes.                                                        |
| `date`                        | `DATE` NN, default `CURRENT_DATE`                                             | Work-order/estimate date.                                                                                                                      |
| `prepared_by`                 | `TEXT`                                                                        | Human-readable preparer.                                                                                                                       |
| `odometer`                    | `INTEGER`                                                                     | Odometer reading; no DB non-negative check.                                                                                                    |
| `currency`                    | `currency_code` NN, default `PHP`                                             | Display/calculation currency. No exchange conversion is performed.                                                                             |
| `payer_type`                  | `TEXT`, check `customer/insurance/both`                                       | Responsible payer category.                                                                                                                    |
| `insurance_company`           | `TEXT`                                                                        | Insurance company.                                                                                                                             |
| `insurance_policy_no`         | `TEXT`                                                                        | Policy reference.                                                                                                                              |
| `insurance_claim_no`          | `TEXT`                                                                        | Claim reference.                                                                                                                               |
| `linked_work_order_id`        | `UUID`, self FK plus same-workshop composite FK                               | Optional related work order. Composite FK uses `ON DELETE RESTRICT`.                                                                           |
| `overall_discount_type`       | `TEXT`, check `amount/percent`                                                | Overall discount mode or `NULL`.                                                                                                               |
| `overall_discount_value`      | `NUMERIC(12,2)` NN, default `0`                                               | Discount amount or percentage. Check requires zero when type is null and 0-100 for percent.                                                    |
| `notes`                       | `TEXT`                                                                        | Customer-visible notes; included in PDFs.                                                                                                      |
| `internal_notes`              | `TEXT`                                                                        | Staff notes; current PDF does not render them.                                                                                                 |
| `terms`                       | `TEXT`                                                                        | Document terms.                                                                                                                                |
| `dropoff_condition_notes`     | `TEXT`                                                                        | Condition notes at intake.                                                                                                                     |
| `dropoff_representative_name` | `TEXT`                                                                        | Drop-off representative name.                                                                                                                  |
| `dropoff_representative_id`   | `TEXT`                                                                        | Free-form representative ID reference.                                                                                                         |
| `dropoff_inspected_at`        | `TIMESTAMPTZ`                                                                 | Inspection timestamp.                                                                                                                          |
| `created_at`                  | `TIMESTAMPTZ` NN, default `now()`                                             | Creation time.                                                                                                                                 |
| `updated_at`                  | `TIMESTAMPTZ` NN, default `now()`                                             | Last update time.                                                                                                                              |
| `created_by`                  | `UUID`, FK to `auth.users`                                                    | Creating actor.                                                                                                                                |
| `updated_by`                  | `UUID`, FK to `auth.users`                                                    | Last updating actor.                                                                                                                           |
| `deleted_at`                  | `TIMESTAMPTZ`                                                                 | Soft-delete marker.                                                                                                                            |

### `line_items`

Priced work-order item.

| Column                | Type and constraints                                       | Meaning                                                                                                               |
| --------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `id`                  | `UUID` PK, default `gen_random_uuid()`                     | Line-item identifier.                                                                                                 |
| `workshop_id`         | `UUID` NN, FK to `workshops`, default current workshop     | Tenant scope.                                                                                                         |
| `work_order_id`       | `UUID` NN, FK to `work_orders`, composite same-workshop FK | Parent work order. The original FK says cascade; the later composite FK restricts hard parent deletion.               |
| `category`            | `line_item_category` NN                                    | `fluids`, `parts`, `accessories`, `labor`, or `other`.                                                                |
| `item`                | `TEXT` NN                                                  | Item/service name.                                                                                                    |
| `specification`       | `TEXT`                                                     | Description or specification.                                                                                         |
| `part_number`         | `TEXT`                                                     | Supplier/manufacturer part number.                                                                                    |
| `quantity`            | `NUMERIC(10,2)` NN, default `1`, check greater than zero   | Quantity.                                                                                                             |
| `unit`                | `TEXT` NN, default `pc`                                    | Free-form unit with UI suggestions.                                                                                   |
| `unit_price`          | `NUMERIC(12,2)` NN, default `0`, check non-negative        | Price per unit.                                                                                                       |
| `line_total`          | `NUMERIC(12,2)` NN, default `0`, check non-negative        | Persisted gross. Application displays recomputed values.                                                              |
| `discount_type`       | `TEXT`, check `amount/percent`                             | Line discount mode or `NULL`.                                                                                         |
| `discount_value`      | `NUMERIC(12,2)` NN, default `0`                            | Discount amount or percentage with validation check.                                                                  |
| `installation_status` | `TEXT`                                                     | UI values include `to_confirm`, `ordered`, `in_stock`, `installed`, `out_of_stock`, `na`; DB does not constrain them. |
| `notes`               | `TEXT`                                                     | Remarks.                                                                                                              |
| `source_url`          | `TEXT`                                                     | Optional external source.                                                                                             |
| `is_inventory`        | `BOOLEAN` NN, default `false`                              | Future inventory-link marker; no inventory table exists.                                                              |
| `sort_order`          | `INTEGER` NN, default `0`                                  | Display order.                                                                                                        |
| `created_at`          | `TIMESTAMPTZ` NN, default `now()`                          | Creation time.                                                                                                        |
| `updated_at`          | `TIMESTAMPTZ` NN, default `now()`                          | Last update time.                                                                                                     |
| `created_by`          | `UUID`, FK to `auth.users`                                 | Creating actor.                                                                                                       |
| `updated_by`          | `UUID`, FK to `auth.users`                                 | Last updating actor.                                                                                                  |
| `deleted_at`          | `TIMESTAMPTZ`                                              | Soft-delete marker.                                                                                                   |

### `activity_logs`

Append-oriented human-readable event history.

| Column          | Type and constraints                                       | Meaning                                                                                                   |
| --------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `id`            | `UUID` PK, default `gen_random_uuid()`                     | Event identifier.                                                                                         |
| `workshop_id`   | `UUID` NN, FK to `workshops`, default current workshop     | Tenant scope.                                                                                             |
| `work_order_id` | `UUID` NN, FK to `work_orders`, composite same-workshop FK | Parent work order.                                                                                        |
| `event_type`    | `TEXT` NN                                                  | Event code. Status trigger writes `status_changed`; application constants contain additional event names. |
| `description`   | `TEXT` NN                                                  | Human-readable event summary.                                                                             |
| `metadata`      | `JSONB`                                                    | Structured event details.                                                                                 |
| `created_at`    | `TIMESTAMPTZ` NN, default `now()`                          | Event time.                                                                                               |
| `created_by`    | `UUID`, FK to `auth.users`                                 | Actor.                                                                                                    |

There are no `updated_at`, `updated_by`, or `deleted_at` columns and no client update/delete policy.

### `notifications`

Stored notification/event record. Delivery and persisted preference UI are not implemented.

| Column          | Type and constraints                                    | Meaning                                |
| --------------- | ------------------------------------------------------- | -------------------------------------- |
| `id`            | `UUID` PK, default `gen_random_uuid()`                  | Notification identifier.               |
| `workshop_id`   | `UUID` NN, FK to `workshops`, default current workshop  | Tenant scope.                          |
| `work_order_id` | `UUID`, FK to `work_orders`, composite same-workshop FK | Optional related work order.           |
| `event_type`    | `TEXT` NN                                               | Event code.                            |
| `title`         | `TEXT` NN                                               | Notification title.                    |
| `message`       | `TEXT`                                                  | Optional body.                         |
| `metadata`      | `JSONB`                                                 | Structured context.                    |
| `is_read`       | `BOOLEAN` NN, default `false`                           | Read state.                            |
| `created_at`    | `TIMESTAMPTZ` NN, default `now()`                       | Creation time.                         |
| `updated_at`    | `TIMESTAMPTZ` NN, default `now()`                       | Last update time; added by `00009`.    |
| `created_by`    | `UUID`, FK to `auth.users`                              | Creating actor.                        |
| `updated_by`    | `UUID`, FK to `auth.users`                              | Last updating actor; added by `00009`. |
| `deleted_at`    | `TIMESTAMPTZ`                                           | Soft-delete marker.                    |

## Finance, documents, and settings

### `payments`

Positive payment ledger entry.

| Column             | Type and constraints                                                             | Meaning                     |
| ------------------ | -------------------------------------------------------------------------------- | --------------------------- |
| `id`               | `UUID` PK, default `gen_random_uuid()`                                           | Payment identifier.         |
| `workshop_id`      | `UUID` NN, FK to `workshops`, default current workshop                           | Tenant scope.               |
| `work_order_id`    | `UUID` NN, FK to `work_orders`, composite same-workshop FK, `ON DELETE RESTRICT` | Paid work order.            |
| `date`             | `DATE` NN, default `CURRENT_DATE`                                                | Payment date.               |
| `amount`           | `NUMERIC(12,2)` NN, check greater than zero                                      | Payment amount.             |
| `payment_method`   | `TEXT` NN, default `cash`                                                        | Free-form method.           |
| `payment_type`     | `TEXT` NN, default `regular`, check `deposit/regular`                            | Deposit or regular payment. |
| `reference_number` | `TEXT`                                                                           | External/reference number.  |
| `notes`            | `TEXT`                                                                           | Optional notes.             |
| `created_at`       | `TIMESTAMPTZ` NN, default `now()`                                                | Creation time.              |
| `updated_at`       | `TIMESTAMPTZ` NN, default `now()`                                                | Last update time.           |
| `created_by`       | `UUID`, FK to `auth.users`                                                       | Creating actor.             |
| `updated_by`       | `UUID`, FK to `auth.users`                                                       | Last updating actor.        |
| `deleted_at`       | `TIMESTAMPTZ`                                                                    | Soft-delete marker.         |

### `documents`

Metadata placeholder for generated work-order documents. Current PDF code does not insert rows.

| Column          | Type and constraints                                                              | Meaning                                       |
| --------------- | --------------------------------------------------------------------------------- | --------------------------------------------- |
| `id`            | `UUID` PK, default `gen_random_uuid()`                                            | Document metadata identifier.                 |
| `workshop_id`   | `UUID` NN, FK to `workshops`, default current workshop                            | Tenant scope.                                 |
| `work_order_id` | `UUID` NN, FK to `work_orders`, composite same-workshop FK                        | Source work order.                            |
| `document_type` | `TEXT` NN, check `estimate/statement_of_account/payment_acknowledgment/job_order` | Document kind.                                |
| `title`         | `TEXT`                                                                            | Optional title.                               |
| `status`        | `TEXT` NN, default `draft`                                                        | Free-form document status; no DB value check. |
| `generated_at`  | `TIMESTAMPTZ`                                                                     | Generation timestamp.                         |
| `created_at`    | `TIMESTAMPTZ` NN, default `now()`                                                 | Creation time.                                |
| `updated_at`    | `TIMESTAMPTZ` NN, default `now()`                                                 | Last update time.                             |
| `created_by`    | `UUID`, FK to `auth.users`                                                        | Creating actor.                               |
| `updated_by`    | `UUID`, FK to `auth.users`                                                        | Last updating actor.                          |
| `deleted_at`    | `TIMESTAMPTZ`                                                                     | Soft-delete marker.                           |

### `shop_settings`

Workshop identity and document configuration. A partial unique index permits one active row per workshop.

| Column                   | Type and constraints                                   | Meaning                                                                        |
| ------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `id`                     | `UUID` PK, default `gen_random_uuid()`                 | Settings row identifier.                                                       |
| `workshop_id`            | `UUID` NN, FK to `workshops`, default current workshop | Tenant scope; one active row per workshop.                                     |
| `shop_name`              | `TEXT` NN, default `My Repair Shop`                    | Display/business name.                                                         |
| `address`                | `TEXT`                                                 | Shop address.                                                                  |
| `contact_number`         | `TEXT`                                                 | Contact number.                                                                |
| `email`                  | `TEXT`                                                 | Contact email.                                                                 |
| `logo_url`               | `TEXT`                                                 | Logo URL used by documents.                                                    |
| `tax_id`                 | `TEXT`                                                 | Legacy/general tax identifier.                                                 |
| `tin`                    | `TEXT`                                                 | Tax Identification Number.                                                     |
| `dti_bn`                 | `TEXT`                                                 | DTI/business registration number.                                              |
| `business_permit`        | `TEXT`                                                 | Business permit number.                                                        |
| `terms_conditions`       | `TEXT`                                                 | Default terms text. Current work-order form uses its own `terms` value.        |
| `include_photo_appendix` | `BOOLEAN` NN, default `false`                          | Include customer-visible evidence in PDFs. Not exposed by current Settings UI. |
| `created_at`             | `TIMESTAMPTZ` NN, default `now()`                      | Creation time.                                                                 |
| `updated_at`             | `TIMESTAMPTZ` NN, default `now()`                      | Last update time.                                                              |
| `created_by`             | `UUID`, FK to `auth.users`                             | Creating actor.                                                                |
| `updated_by`             | `UUID`, FK to `auth.users`                             | Last updating actor.                                                           |
| `deleted_at`             | `TIMESTAMPTZ`                                          | Soft-delete marker; added by `00009`.                                          |

Members can read active settings; only owners can insert/update through RLS.

## Catalog and packages

### `labor_items`

Reusable labor/service catalog entry.

| Column        | Type and constraints                                   | Meaning                               |
| ------------- | ------------------------------------------------------ | ------------------------------------- |
| `id`          | `UUID` PK, default `gen_random_uuid()`                 | Labor item identifier.                |
| `workshop_id` | `UUID` NN, FK to `workshops`, default current workshop | Tenant scope.                         |
| `name`        | `TEXT` NN                                              | Catalog name.                         |
| `description` | `TEXT`                                                 | Optional description.                 |
| `category`    | `TEXT` NN, default `labor`, category check             | One of the five line-item categories. |
| `unit_price`  | `NUMERIC` NN, default `0`, check non-negative          | Default price.                        |
| `unit`        | `TEXT` NN, default `service`                           | Default unit.                         |
| `sort_order`  | `INTEGER` NN, default `0`                              | Display order.                        |
| `created_at`  | `TIMESTAMPTZ` NN, default `now()`                      | Creation time.                        |
| `updated_at`  | `TIMESTAMPTZ` NN, default `now()`                      | Last update time.                     |
| `created_by`  | `UUID`, FK to `auth.users`                             | Creating actor.                       |
| `updated_by`  | `UUID`, FK to `auth.users`                             | Last updating actor.                  |
| `deleted_at`  | `TIMESTAMPTZ`                                          | Soft-delete marker.                   |

### `service_packages`

Reusable package header.

| Column        | Type and constraints                                   | Meaning                                                                 |
| ------------- | ------------------------------------------------------ | ----------------------------------------------------------------------- |
| `id`          | `UUID` PK, default `gen_random_uuid()`                 | Package identifier.                                                     |
| `workshop_id` | `UUID` NN, FK to `workshops`, default current workshop | Tenant scope. `(workshop_id, id)` is unique for child integrity.        |
| `name`        | `TEXT` NN                                              | Package name.                                                           |
| `description` | `TEXT`                                                 | Optional description.                                                   |
| `category`    | `TEXT` NN, default `parts`, category check             | Package category.                                                       |
| `total_price` | `NUMERIC`, check null or non-negative                  | Optional package-level price. Current line insertion uses child prices. |
| `sort_order`  | `INTEGER` NN, default `0`                              | Display order.                                                          |
| `created_at`  | `TIMESTAMPTZ` NN, default `now()`                      | Creation time.                                                          |
| `updated_at`  | `TIMESTAMPTZ` NN, default `now()`                      | Last update time.                                                       |
| `created_by`  | `UUID`, FK to `auth.users`                             | Creating actor.                                                         |
| `updated_by`  | `UUID`, FK to `auth.users`                             | Last updating actor.                                                    |
| `deleted_at`  | `TIMESTAMPTZ`                                          | Soft-delete marker.                                                     |

### `package_items`

Ordered child item in a service package.

| Column        | Type and constraints                                            | Meaning                                                                                  |
| ------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `id`          | `UUID` PK, default `gen_random_uuid()`                          | Package-item identifier.                                                                 |
| `workshop_id` | `UUID` NN, FK to `workshops`, default current workshop          | Tenant scope; added by `00009`.                                                          |
| `package_id`  | `UUID` NN, FK to `service_packages`, composite same-workshop FK | Parent package. Original FK cascades; later composite FK restricts hard parent deletion. |
| `item_type`   | `TEXT` NN, category check                                       | Resulting line-item category.                                                            |
| `name`        | `TEXT` NN                                                       | Item name.                                                                               |
| `description` | `TEXT`                                                          | Optional description.                                                                    |
| `quantity`    | `NUMERIC` NN, default `1`, check greater than zero              | Default quantity.                                                                        |
| `unit`        | `TEXT` NN, default `pc`                                         | Default unit.                                                                            |
| `unit_price`  | `NUMERIC` NN, default `0`, check non-negative                   | Default unit price.                                                                      |
| `sort_order`  | `INTEGER` NN, default `0`                                       | Position within package.                                                                 |
| `created_at`  | `TIMESTAMPTZ` NN, default `now()`                               | Creation time.                                                                           |
| `updated_at`  | `TIMESTAMPTZ` NN, default `now()`                               | Last update time; added by `00009`.                                                      |
| `created_by`  | `UUID`, FK to `auth.users`                                      | Creating actor; added by `00009`.                                                        |
| `updated_by`  | `UUID`, FK to `auth.users`                                      | Last updating actor; added by `00009`.                                                   |
| `deleted_at`  | `TIMESTAMPTZ`                                                   | Soft-delete marker; added by `00009`.                                                    |

## Evidence

### `attachments`

Current generic evidence metadata. The parent association is enforced by trigger instead of physical FKs because one column can target several tables.

| Column              | Type and constraints                                             | Meaning                                                                                                                                                                                         |
| ------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                | `UUID` PK, default `gen_random_uuid()`                           | Attachment metadata identifier.                                                                                                                                                                 |
| `workshop_id`       | `UUID` NN, FK to `workshops`, default current workshop           | Tenant scope.                                                                                                                                                                                   |
| `parent_type`       | `TEXT` NN, check `vehicle/work_order/line_item/customer`         | Parent table discriminator. Current app upload types omit `customer`.                                                                                                                           |
| `parent_id`         | `UUID` NN                                                        | Parent row ID, validated against active same-workshop row by trigger.                                                                                                                           |
| `attachment_type`   | `TEXT` NN, default `other`, category check                       | Evidence category: `before`, `during`, `after`, `damage`, `vehicle_overview`, `odometer`, `vin`, `plate_number`, `authorization_letter`, `tool_condition_out`, `tool_condition_in`, or `other`. |
| `file_kind`         | `TEXT`                                                           | Legacy/general kind copied from the pre-`00008` attachment type, such as image/PDF/document. No final DB check. Current uploader writes `image`.                                                |
| `mime_type`         | `TEXT`                                                           | MIME metadata. Current uploader writes `image/jpeg`.                                                                                                                                            |
| `storage_path`      | `TEXT` NN                                                        | Private object path. Current secure path starts with workshop UUID.                                                                                                                             |
| `thumbnail_path`    | `TEXT`                                                           | Optional thumbnail object path.                                                                                                                                                                 |
| `original_filename` | `TEXT`                                                           | User's original filename.                                                                                                                                                                       |
| `file_size`         | `INTEGER`                                                        | Processed full-image byte size recorded by the client.                                                                                                                                          |
| `width`             | `INTEGER`, null or greater than zero                             | Processed image width.                                                                                                                                                                          |
| `height`            | `INTEGER`, null or greater than zero                             | Processed image height.                                                                                                                                                                         |
| `caption`           | `TEXT`                                                           | Optional evidence caption.                                                                                                                                                                      |
| `taken_at`          | `TIMESTAMPTZ`                                                    | Capture/evidence time. Current upload sets client current time.                                                                                                                                 |
| `visibility`        | `TEXT` NN, default `workshop`, check `private/workshop/customer` | Private rows are owner-only; workshop/customer rows are member-readable. Customer visibility also controls PDF appendix selection.                                                             |
| `display_order`     | `INTEGER` NN, default `0`                                        | Gallery ordering field. Current queries primarily order by time.                                                                                                                                |
| `uploaded_by`       | `UUID`, FK to `auth.users`                                       | Uploader actor populated by trigger.                                                                                                                                                            |
| `created_at`        | `TIMESTAMPTZ` NN, default `now()`                                | Metadata creation time.                                                                                                                                                                         |
| `updated_at`        | `TIMESTAMPTZ`, default `now()`                                   | Last metadata update. Migration `00008` did not mark this column non-null.                                                                                                                      |
| `created_by`        | `UUID`, FK to `auth.users`                                       | Creating actor.                                                                                                                                                                                 |
| `updated_by`        | `UUID`, FK to `auth.users`                                       | Last updating actor.                                                                                                                                                                            |
| `deleted_at`        | `TIMESTAMPTZ`                                                    | Metadata soft-delete marker. Storage object is not automatically removed.                                                                                                                       |

### `photos` (legacy)

Legacy photo-only metadata. Current gallery/upload code uses `attachments`, but this table remains scoped and queryable.

| Column          | Type and constraints                                   | Meaning                                                           |
| --------------- | ------------------------------------------------------ | ----------------------------------------------------------------- |
| `id`            | `UUID` PK, default `gen_random_uuid()`                 | Legacy photo identifier.                                          |
| `workshop_id`   | `UUID` NN, FK to `workshops`, default current workshop | Tenant scope added by `00009`.                                    |
| `url`           | `TEXT` NN                                              | Legacy URL/path.                                                  |
| `thumbnail_url` | `TEXT`                                                 | Legacy thumbnail URL/path.                                        |
| `vehicle_id`    | `UUID`, FK to `vehicles`, `ON DELETE CASCADE`          | Optional vehicle parent. No same-workshop composite FK was added. |
| `work_order_id` | `UUID`, FK to `work_orders`, `ON DELETE CASCADE`       | Optional work-order parent; renamed from `job_id` in `00005`.     |
| `line_item_id`  | `UUID`, FK to `line_items`, `ON DELETE CASCADE`        | Optional line-item parent.                                        |
| `photo_type`    | `photo_type` NN, default `vehicle_overview`            | Legacy category.                                                  |
| `caption`       | `TEXT`                                                 | Caption.                                                          |
| `file_size`     | `INTEGER`                                              | Bytes.                                                            |
| `mime_type`     | `TEXT`                                                 | MIME type.                                                        |
| `created_at`    | `TIMESTAMPTZ` NN, default `now()`                      | Creation time.                                                    |
| `updated_at`    | `TIMESTAMPTZ` NN, default `now()`                      | Last update time, added by `00003`.                               |
| `created_by`    | `UUID`, FK to `auth.users`                             | Creating actor; trigger repaired in `00009`.                      |
| `updated_by`    | `UUID`, FK to `auth.users`                             | Last updating actor, added by `00003`.                            |
| `deleted_at`    | `TIMESTAMPTZ`                                          | Soft-delete marker.                                               |

Do not drop or rewrite this table or any legacy storage bucket without a target-specific inventory, backup, and explicit retention decision.

## Number allocation

### `work_order_number_counters`

Internal atomic counter. Authenticated clients have no direct RLS policy.

| Column         | Type and constraints                                             | Meaning                        |
| -------------- | ---------------------------------------------------------------- | ------------------------------ |
| `workshop_id`  | `UUID` NN, FK to `workshops`, `ON DELETE RESTRICT`, composite PK | Counter owner.                 |
| `counter_date` | `DATE` NN, composite PK                                          | Workshop-local calendar date.  |
| `last_value`   | `INTEGER` NN, check greater than zero                            | Last allocated sequence value. |

The only intended authenticated interface is `next_work_order_number()`. Counter values may contain gaps and must not be decremented or reused.

## Supabase-owned dependencies

| Object            | Ownership        | Application dependency                                                                                                                                           |
| ----------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.users`      | Supabase Auth    | Referenced by workshop ownership, memberships, and audit actor columns. An `AFTER INSERT` trigger provisions workshop data.                                      |
| `storage.buckets` | Supabase Storage | Migration `00009` upserts private bucket `attachments` with 10 MiB/JPEG restrictions.                                                                            |
| `storage.objects` | Supabase Storage | Object rows are protected by `attachments_workshop_read`, which derives workshop scope from the first path segment. Writes are server-only through service role. |

The migration test creates simplified versions of these objects in PGlite. Their test definitions are not a replacement for live Supabase platform verification.

## Important functions and triggers

| Function                                       | Caller/use                            | Effect                                                               |
| ---------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `current_workshop_id()`                        | Authenticated app and column defaults | Returns one active membership, preferring owner role.                |
| `is_workshop_member(uuid)`                     | RLS and scope checks                  | Tests active membership.                                             |
| `is_workshop_owner(uuid)`                      | Owner-only RLS                        | Tests active owner membership.                                       |
| `next_work_order_number(uuid default current)` | Work-order create/copy action         | Atomically increments daily counter and returns `YY-MMDD-000001`.    |
| `create_work_order_with_items(jsonb, jsonb)`   | Work-order create action              | Allocates the number and inserts the draft plus items atomically.    |
| `update_work_order_with_items(...)`            | Work-order edit action                | Checks expected version and updates the order/items atomically.      |
| `transition_work_order_status(...)`            | Work-order status control             | Checks expected version and applies the database status graph.       |
| `copy_work_order_transactional(uuid)`          | Work-order copy action                | Allocates a new draft number and copies active items atomically.      |
| `soft_delete_record(text, uuid)`               | Shared soft-delete adapter            | Soft-deletes an allowlisted row in the current workshop.             |
| `restore_record(text, uuid)`                   | Restore actions                       | Restores an allowlisted row in the current workshop.                 |
| `soft_delete_package_items(uuid)`              | Package update action                 | Soft-deletes active children before replacement.                     |
| `handle_new_auth_user()`                       | Trigger on `auth.users`               | Creates workshop, owner membership, and settings.                    |
| `enforce_workshop_scope()`                     | Trigger on scoped tables              | Supplies/validates immutable tenant scope.                           |
| `validate_attachment_parent()`                 | Attachment trigger                    | Verifies active polymorphic parent and matching workshop.            |
| `validate_active_relationship()`               | Operational child triggers            | Rejects active children whose same-workshop parent is unavailable.   |
| `enforce_work_order_transition()`              | Work-order update trigger             | Validates status graph, increments version, and logs status changes. |
| `recalculate_work_order_payment_status(uuid)`  | Financial triggers                    | Derives payment state from active totals and payments.               |
| `set_created_by()`, `set_updated_by()`         | Audit triggers                        | Uses authenticated actor or trusted supplied actor.                  |
| `set_attachment_uploader()`                    | Attachment insert trigger             | Sets `uploaded_by`.                                                  |
| `update_updated_at()`                          | Update triggers                       | Sets `updated_at=now()`.                                             |

Security-definer functions use an empty search path and schema-qualified references where implemented. Public execution is revoked for the tenant helpers and mutation RPCs, then granted to `authenticated` as needed.
