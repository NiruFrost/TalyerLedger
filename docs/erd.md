# Entity Relationship Diagram

## Current public schema

```mermaid
erDiagram
    AUTH_USERS {
        uuid id PK
        jsonb raw_user_meta_data
    }

    WORKSHOPS {
        uuid id PK
        uuid owner_id FK,UK
        text name
        text timezone
        timestamptz deleted_at
    }

    WORKSHOP_MEMBERS {
        uuid workshop_id PK,FK
        uuid user_id PK,FK
        text role
        timestamptz deleted_at
    }

    CUSTOMERS {
        uuid id PK
        uuid workshop_id FK
        text name
        text email
        text phone
        timestamptz deleted_at
    }

    VEHICLES {
        uuid id PK
        uuid workshop_id FK
        uuid customer_id FK
        text make
        text model
        int year
        text vin
        text plate
        text cover_photo
        timestamptz deleted_at
    }

    WORK_ORDERS {
        uuid id PK
        uuid workshop_id FK
        text estimate_no UK
        uuid vehicle_id FK
        uuid customer_id FK
        uuid linked_work_order_id FK
        work_order_status status
        text payment_status
        date date
        currency_code currency
        int version
        timestamptz deleted_at
    }

    LINE_ITEMS {
        uuid id PK
        uuid workshop_id FK
        uuid work_order_id FK
        line_item_category category
        text item
        numeric quantity
        numeric unit_price
        numeric line_total
        text discount_type
        numeric discount_value
        int sort_order
        timestamptz deleted_at
    }

    PAYMENTS {
        uuid id PK
        uuid workshop_id FK
        uuid work_order_id FK
        date date
        numeric amount
        text payment_method
        text payment_type
        timestamptz deleted_at
    }

    DOCUMENTS {
        uuid id PK
        uuid workshop_id FK
        uuid work_order_id FK
        text document_type
        text status
        timestamptz generated_at
        timestamptz deleted_at
    }

    ACTIVITY_LOGS {
        uuid id PK
        uuid workshop_id FK
        uuid work_order_id FK
        text event_type
        text description
        jsonb metadata
        timestamptz created_at
    }

    NOTIFICATIONS {
        uuid id PK
        uuid workshop_id FK
        uuid work_order_id FK
        text event_type
        text title
        boolean is_read
        timestamptz deleted_at
    }

    ATTACHMENTS {
        uuid id PK
        uuid workshop_id FK
        text parent_type
        uuid parent_id
        text attachment_type
        text file_kind
        text storage_path
        text thumbnail_path
        text visibility
        timestamptz deleted_at
    }

    PHOTOS {
        uuid id PK
        uuid workshop_id FK
        uuid vehicle_id FK
        uuid work_order_id FK
        uuid line_item_id FK
        text url
        photo_type photo_type
        timestamptz deleted_at
    }

    SHOP_SETTINGS {
        uuid id PK
        uuid workshop_id FK
        text shop_name
        text tin
        text dti_bn
        text business_permit
        boolean include_photo_appendix
        timestamptz deleted_at
    }

    LABOR_ITEMS {
        uuid id PK
        uuid workshop_id FK
        text name
        text category
        numeric unit_price
        int sort_order
        timestamptz deleted_at
    }

    SERVICE_PACKAGES {
        uuid id PK
        uuid workshop_id FK
        text name
        text category
        numeric total_price
        int sort_order
        timestamptz deleted_at
    }

    PACKAGE_ITEMS {
        uuid id PK
        uuid workshop_id FK
        uuid package_id FK
        text item_type
        text name
        numeric quantity
        numeric unit_price
        int sort_order
        timestamptz deleted_at
    }

    WORK_ORDER_NUMBER_COUNTERS {
        uuid workshop_id PK,FK
        date counter_date PK
        int last_value
    }

    AUTH_USERS ||--o| WORKSHOPS : owns
    AUTH_USERS ||--o{ WORKSHOP_MEMBERS : participates
    WORKSHOPS ||--o{ WORKSHOP_MEMBERS : has

    WORKSHOPS ||--o{ CUSTOMERS : scopes
    WORKSHOPS ||--o{ VEHICLES : scopes
    WORKSHOPS ||--o{ WORK_ORDERS : scopes
    WORKSHOPS ||--o{ LINE_ITEMS : scopes
    WORKSHOPS ||--o{ PAYMENTS : scopes
    WORKSHOPS ||--o{ DOCUMENTS : scopes
    WORKSHOPS ||--o{ ACTIVITY_LOGS : scopes
    WORKSHOPS ||--o{ NOTIFICATIONS : scopes
    WORKSHOPS ||--o{ ATTACHMENTS : scopes
    WORKSHOPS ||--o{ PHOTOS : scopes
    WORKSHOPS ||--o{ SHOP_SETTINGS : configures
    WORKSHOPS ||--o{ LABOR_ITEMS : scopes
    WORKSHOPS ||--o{ SERVICE_PACKAGES : scopes
    WORKSHOPS ||--o{ PACKAGE_ITEMS : scopes
    WORKSHOPS ||--o{ WORK_ORDER_NUMBER_COUNTERS : allocates

    CUSTOMERS o|--o{ VEHICLES : associated_with
    CUSTOMERS o|--o{ WORK_ORDERS : billed_to
    VEHICLES ||--o{ WORK_ORDERS : serviced_by
    WORK_ORDERS o|--o{ WORK_ORDERS : linked_to
    WORK_ORDERS ||--o{ LINE_ITEMS : contains
    WORK_ORDERS ||--o{ PAYMENTS : receives
    WORK_ORDERS ||--o{ DOCUMENTS : renders
    WORK_ORDERS ||--o{ ACTIVITY_LOGS : records
    WORK_ORDERS o|--o{ NOTIFICATIONS : relates_to
    SERVICE_PACKAGES ||--o{ PACKAGE_ITEMS : contains

    CUSTOMERS o|..o{ ATTACHMENTS : polymorphic_parent
    VEHICLES o|..o{ ATTACHMENTS : polymorphic_parent
    WORK_ORDERS o|..o{ ATTACHMENTS : polymorphic_parent
    LINE_ITEMS o|..o{ ATTACHMENTS : polymorphic_parent

    VEHICLES o|--o{ PHOTOS : legacy_parent
    WORK_ORDERS o|--o{ PHOTOS : legacy_parent
    LINE_ITEMS o|--o{ PHOTOS : legacy_parent
```

## Interpretation notes

- `AUTH_USERS` represents Supabase-owned `auth.users`, not a public application table.
- All solid tenant relationships originate from `workshops`. Operational rows have non-null `workshop_id` and workshop-scoped RLS.
- Customer links on vehicles and work orders are optional. Every work order requires a vehicle.
- A work order can link to another work order in the same workshop.
- `attachments` uses a polymorphic relationship. The dotted lines are conceptual, not physical foreign keys. `validate_attachment_parent()` checks active parent existence and workshop equality for `customer`, `vehicle`, `work_order`, and `line_item`.
- Current TypeScript, database, and upload routing support customer, vehicle, work-order, and line-item attachment parents.
- `photos` is the legacy evidence table. Its three parent FKs are independently nullable, and the schema does not require exactly one parent. New application galleries use `attachments`.
- `shop_settings` can contain historical soft-deleted rows; a partial unique index allows only one active row per workshop.
- Work-order number uniqueness is composite: `(workshop_id, estimate_no)`. Counter identity is `(workshop_id, counter_date)`.
- Several original single-column FKs remain alongside newer composite workshop FKs. The composite constraints are what prevent cross-workshop references.

Column-level definitions are in [data-dictionary.md](data-dictionary.md); status and payment flows are in [database-schema.md](database-schema.md).
