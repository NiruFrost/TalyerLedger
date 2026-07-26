# TalyerLedger — Master Build Prompt v3

This specification supersedes all previous TalyerLedger build prompts.

Use it as the permanent engineering constitution for the project. Individual phase prompts may add implementation details, but they must not contradict this master specification unless the owner explicitly approves a documented architecture change.

---

# 1. Role and Working Agreement

You are my senior full-stack software engineer, software architect, database designer, UI/UX and Human-Computer Interaction designer, DevOps engineer, security engineer, QA engineer, performance engineer, technical writer, and code reviewer.

You are building a real production-quality system, not a visual prototype or classroom mock-up.

Your responsibilities are to:

* inspect and understand the existing repository before changing it
* preserve working functionality
* design before implementing
* identify architectural risks
* implement features incrementally
* validate every change
* maintain documentation continuously
* keep the project compilable and runnable
* prevent regressions
* explain important decisions
* leave the repository cleaner than you found it

Do not initialize a new application when an existing project already exists.

Do not replace functioning modules merely because a different implementation is easier.

Do not silently change architecture, database semantics, naming conventions, security policies, or core workflows.

Ask for approval only when a decision is genuinely architectural, irreversible, financially consequential, privacy-sensitive, or incompatible with an existing requirement.

For ordinary implementation details, use sound engineering judgment and proceed independently.

---

# 2. Product Vision

Build a production-quality system named **TalyerLedger**.

TalyerLedger is a modern workshop operations, repair-estimate, work-order, payment, vehicle-record, digital-evidence, analytics, and tool-accountability platform.

It initially serves one small automotive or machine-repair shop owner, but its architecture must support gradual expansion into:

* fleet maintenance
* heavy-equipment maintenance
* industrial workshops
* manufacturing maintenance
* mining equipment support
* FIFO maintenance operations
* lightweight CMMS and EAM workflows
* multiple users
* multiple sites or workshops

The system replaces manual spreadsheets, disconnected photos, handwritten notes, and informal payment records with one traceable cloud-backed workflow.

The project must remain practical for personal use at approximately **$0 per month**, using free tiers where technically and operationally reasonable.

---

# 3. Industrial and CMMS Design Direction

Treat TalyerLedger as more than an invoice application.

Model the complete maintenance lifecycle:

```text
Customer or Requestor
        ↓
Vehicle or Asset
        ↓
Intake and Inspection
        ↓
Work Order
        ↓
Estimate and Approval
        ↓
Execution and Evidence
        ↓
Quality Inspection
        ↓
Payment and Release
        ↓
Maintenance History
        ↓
Analytics and Continuous Improvement
```

Apply industrial-engineering and maintenance-management concepts:

* standardized workflows
* traceability
* visual management
* work-in-progress visibility
* process-status control
* error prevention
* repeatable checklists
* asset history
* root-cause readiness
* preventive-maintenance readiness
* quality-control gates
* downtime and repair-duration measurement
* parts, labor, tool, and evidence accountability
* measurable operational KPIs
* continuous-improvement feedback loops

The system should support portfolio discussions related to:

* CMMS administration
* maintenance planning
* industrial technical support
* mining technology
* fleet support
* asset management
* reliability support
* data analytics
* systems integration
* process improvement

---

# 4. Core Product Goals

TalyerLedger must eventually support:

* customer management
* vehicle and asset management
* work-order creation and tracking
* repair estimates
* job orders
* statements of account
* payment acknowledgments
* reusable service templates
* line-item calculations
* deposits and partial payments
* split payments
* insurance and warranty cases
* repair evidence
* before-and-after photos
* drop-off-condition documentation
* representatives and proxies
* repair and maintenance history
* tool lending and rental
* borrower accountability
* operational analytics
* financial analytics
* maintenance KPIs
* preventive-maintenance schedules
* searchable audit trails
* printable professional documents
* secure read-only sharing
* PWA, mobile, and desktop packaging

---

# 5. Platform Targets

Maintain one primary application codebase supporting:

* responsive web
* installable Progressive Web App
* Android through Capacitor
* iOS through Capacitor
* Windows through Tauri
* macOS through Tauri
* Linux through Tauri

All platforms must use the same backend and shared domain logic.

Avoid platform-specific forks unless technically necessary.

---

# 6. Approved Technology Stack

## Frontend

* Next.js 16
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Rhea component-style preset
* React Hook Form
* Zod
* TanStack Query
* Recharts
* Lucide React

## Backend and Data

* Supabase
* PostgreSQL
* Supabase Authentication
* Supabase Storage
* Supabase REST capabilities
* database functions or RPC only when they improve integrity or concurrency

## Hosting and Infrastructure

* Vercel
* Supabase free tier
* Cloudflare R2 when media volume requires it
* GitHub Actions for validation, scheduled jobs, and backups

## Documents

* `@react-pdf/renderer`

## Packaging

* Capacitor
* Tauri

## State Management

Use TanStack Query for server state.

Use React Hook Form for form state.

Use local component state for local interaction state.

Introduce Zustand only when a genuine cross-feature client-state problem exists and simpler approaches are insufficient.

Document the reason before introducing another global state library.

---

# 7. Integrative Technology Principles

Integrations must be modular and replaceable.

Use adapter or provider interfaces for:

* database access
* authentication
* media storage
* PDF generation
* OCR
* QR and barcode scanning
* notifications
* scheduled jobs
* backups
* analytics exports

Core business logic must not depend directly on a vendor SDK when a repository or service boundary can isolate it.

The UI must not directly contain Supabase queries.

Recommended flow:

```text
UI Component
    ↓
Feature Hook or Form Controller
    ↓
Service or Use Case
    ↓
Repository Interface
    ↓
Supabase Repository Implementation
```

Do not over-engineer trivial read operations, but maintain a consistent boundary that keeps business logic testable.

---

# 8. Software Architecture Standards

Use a feature-based folder structure.

A suggested direction:

```text
src/
  app/
    (auth)/
    (dashboard)/
    api/
  features/
    auth/
    customers/
    assets/
    work-orders/
    line-items/
    documents/
    attachments/
    payments/
    representatives/
    insurance/
    warranties/
    tools/
    borrowers/
    tool-loans/
    analytics/
    maintenance/
    settings/
  components/
    ui/
    shared/
  lib/
    auth/
    database/
    validation/
    formatting/
    security/
    performance/
    storage/
    pdf/
  db/
    migrations/
    seeds/
    tests/
  docs/
```

Apply:

* strict TypeScript
* strong schemas
* small components
* small functions
* separation of concerns
* composition over inheritance
* reusable domain utilities
* centralized constants
* centralized status definitions
* centralized color mappings
* centralized calculation logic
* centralized date and currency handling
* consistent error objects
* explicit loading, empty, error, success, and permission-denied states

Avoid:

* business calculations embedded across multiple components
* duplicate database queries
* giant page components
* untyped API responses
* silent exceptions
* uncontrolled side effects
* derived values stored redundantly
* dead code
* abandoned experimental files
* unnecessary dependencies

---

# 9. Domain Model Direction

## 9.1 Customer

Customer must be separate from Work Order.

Suggested fields:

```text
id
owner_id
name
phone
email
address
customer_type
notes
created_at
updated_at
created_by
updated_by
deleted_at
```

One customer may own or be associated with many assets.

Support quick customer creation during work-order intake without requiring a separate navigation flow.

---

## 9.2 Asset

Use **Asset** as the core domain concept.

The initial UI may display “Vehicle,” but the data model should support other asset types later.

Suggested fields:

```text
id
owner_id
customer_id
asset_type
asset_code
make
model
year
engine
transmission
vin_or_serial
plate_or_registration
color
meter_type
current_meter_reading
cover_attachment_id
notes
created_at
updated_at
created_by
updated_by
deleted_at
```

Potential asset types:

* Vehicle
* Motorcycle
* Truck
* Excavator
* Loader
* Forklift
* Generator
* Pump
* Compressor
* Conveyor
* Machine
* Other

Do not force industrial fields into the initial vehicle UI. Use progressive disclosure.

---

## 9.3 Work Order

A Work Order is the permanent operational record.

Do not treat the PDF estimate as the permanent domain entity.

Suggested fields:

```text
id
owner_id
job_no
customer_id
asset_id
repair_status
priority
opened_at
scheduled_at
started_at
completed_at
released_at
closed_at
prepared_by
odometer_or_meter
currency
payer_type
customer_visible_notes
internal_notes
terms
overall_discount_type
overall_discount_value
linked_work_order_id
voided_at
void_reason
created_at
updated_at
created_by
updated_by
deleted_at
version
```

Use an optimistic-locking field such as `version` or another safe concurrency mechanism where appropriate.

### Job number format

Use:

```text
YY-MMDD-000001
```

Example:

```text
26-0717-000001
```

Rules:

* `YY` is the final two digits of the year.
* `MMDD` is the local calendar month and day.
* The six-digit sequence starts at `000001` each calendar day.
* Generation must be atomic and concurrency-safe.
* The number is immutable after creation.
* Numbers are never reused.
* Soft-deleted or voided work orders retain their numbers.
* The field has a unique database index.
* The database UUID remains the internal primary identifier.
* Use the configured workshop timezone when determining the date.
* Do not generate numbers solely in the browser.

### Repair status workflow

Repair progress must be separate from payment progress.

Suggested repair statuses:

```text
Draft
Inspection
Estimate
Waiting Approval
Approved
In Progress
Quality Inspection
Ready for Release
Released
Closed
Voided
```

Define allowed transitions centrally.

Do not permit arbitrary status jumps without an explicit override path and audit record.

---

## 9.4 Line Item

Suggested fields:

```text
id
owner_id
work_order_id
display_order
category
item
specification
part_number
quantity
unit
unit_price
discount_type
discount_value
installation_status
remarks
source_url
is_inventory
inventory_item_id
created_at
updated_at
created_by
updated_by
deleted_at
```

Categories:

* Fluids
* Parts
* Accessories
* Labor
* Other

Installation statuses:

* To Confirm
* Ordered
* In Stock
* Installed
* Out of Stock
* N/A

Calculated values:

```text
gross = quantity × unit_price

line_discount_amount =
  Amount  → discount_value
  Percent → gross × discount_value / 100

net = max(gross − line_discount_amount, 0)
```

Do not store duplicated Gross and Net values unless a documented legal, audit, or historical-snapshot requirement later demands it.

Use shared deterministic calculation utilities.

---

## 9.5 Work-Order Summary

Compute:

* subtotal per category
* grand subtotal
* overall discount amount
* total net amount
* total paid
* balance
* payment status

Overall discount:

```text
Amount  → overall_discount_value
Percent → grand_subtotal × overall_discount_value / 100
```

Payment status:

```text
total_paid = 0                        → Unpaid
0 < total_paid < total_net_amount     → Partial
total_paid = total_net_amount         → Paid
total_paid > total_net_amount         → Overpaid
```

Handle zero-total work orders explicitly and consistently.

---

## 9.6 Document Outputs

Generate documents from Work Order data.

Document types:

* Service Estimate
* Job Order
* Statement of Account
* Payment Acknowledgment
* Tool Loan Slip
* Maintenance Report
* Inspection Report

A document is a rendered or snapshotted view of operational data.

For finalized documents, prepare for immutable document snapshots and revision history so later edits do not silently alter previously issued records.

Do not use the labels “Official Receipt” or “Sales Invoice” unless the required business-registration configuration is explicitly provided and the owner approves the terminology.

---

## 9.7 Representatives and Proxies

Allow separate representatives for:

* drop-off
* approval
* pickup

Suggested fields:

```text
id
owner_id
work_order_id
stage
name
phone
relationship
attachment_id
authorization_confirmed
created_at
updated_at
created_by
updated_by
deleted_at
```

Hide these fields behind progressive disclosure by default.

---

## 9.8 Attachments and Digital Evidence

Use a generic Attachment model rather than a photo-only model.

Suggested fields:

```text
id
owner_id
parent_type
parent_id
category
file_kind
mime_type
storage_provider
storage_path
thumbnail_path
original_filename
file_size
width
height
caption
taken_at
is_private
visibility
display_order
uploaded_by
created_at
updated_at
deleted_at
```

Parent types may include:

* Asset
* Work Order
* Line Item
* Representative
* Payment
* Tool
* Borrower
* Tool Loan
* Inspection

Attachment categories:

* Before
* During
* After
* Damage
* Vehicle Overview
* Odometer
* VIN
* Plate
* Drop-off Condition
* Quality Inspection
* Authorization Letter
* Government ID
* Diagnostic Report
* Supplier Document
* Warranty Document
* Tool Condition Out
* Tool Condition In
* Other

Private personal documents must be isolated from ordinary workshop evidence.

---

## 9.9 Payments

Suggested fields:

```text
id
owner_id
work_order_id
payment_date
amount
payment_type
payment_method
paid_by
reference_no
notes
created_at
updated_at
created_by
updated_by
deleted_at
```

Payment types:

* Deposit
* Regular
* Refund
* Adjustment

Paid by:

* Customer
* Insurance
* Warranty
* Other

Payment records must be auditable.

Do not edit the calculated Paid or Balance values directly.

---

## 9.10 Insurance and Warranty

Support:

* payer type
* insurance company
* policy number
* claim number
* adjuster
* adjuster contact
* claim status
* approved claim amount
* linked warranty or comeback work order
* warranty reason
* original work-order link

Warranty and comeback jobs must remain visible in the original asset history.

---

## 9.11 Tool Lending and Rental

Use normalized tables.

Do not store multiple tool IDs in a single array field when a join table is appropriate.

Recommended model:

```text
Tool
Borrower
ToolLoan
ToolLoanItem
ToolLoanPayment
Attachment
```

Tool fields:

```text
id
owner_id
tool_code
name
category
condition
quantity_owned
quantity_available
is_inventory
barcode_or_qr_value
notes
created_at
updated_at
created_by
updated_by
deleted_at
```

Borrower fields:

```text
id
owner_id
name
phone
email
address
id_type
is_blocklisted
blocklist_reason
consent_captured_at
retention_review_at
created_at
updated_at
created_by
updated_by
deleted_at
```

Tool Loan fields:

```text
id
owner_id
loan_no
borrower_id
date_out
expected_return_date
actual_return_date
status
deposit_amount
rental_fee
notes
created_at
updated_at
created_by
updated_by
deleted_at
```

Tool Loan Item fields:

```text
id
tool_loan_id
tool_id
quantity
condition_out
condition_in
returned_quantity
damage_notes
created_at
updated_at
deleted_at
```

Tool loan number:

```text
LN-YY-MMDD-000001
```

Use atomic, concurrency-safe generation.

---

## 9.12 Activity Timeline

Design an immutable or append-oriented operational event model.

Examples:

* work order created
* inspection completed
* estimate issued
* customer approval recorded
* status changed
* line item added
* photo uploaded
* deposit received
* quality inspection completed
* asset released
* warranty return created
* tool borrowed
* tool returned
* borrower blocklisted

Timeline entries should include:

```text
timestamp
actor
event_type
entity_type
entity_id
summary
metadata
```

The activity timeline is not a replacement for database audit columns. It is a human-readable operational history.

---

# 10. Database Standards

Every business table must have:

* UUID primary key
* owner or tenant scope
* `created_at`
* `updated_at`
* `created_by`
* `updated_by`
* `deleted_at` where soft deletion is appropriate

Implement:

* foreign keys
* unique constraints
* check constraints
* appropriate decimal types for money
* appropriate indexes
* partial indexes for active rows when useful
* case-insensitive search strategy where useful
* safe timestamp handling
* migrations from day one
* rollback or reversal guidance
* migration validation on a clean database

Never rely only on manual changes in the Supabase dashboard.

Never use floating-point types for currency.

Do not use cascading hard deletion for operational or audit-sensitive records.

---

# 11. Row Level Security

Enable RLS on every exposed table.

Policies must:

* scope records to the authenticated owner or tenant
* deny cross-user access
* account for soft-deleted records
* restrict private attachments
* prevent public access to borrower PII
* prevent unauthorized role escalation
* validate ownership of referenced parent records
* protect storage objects as well as database metadata

Maintain an RLS policy matrix documenting:

* table
* operation
* permitted role
* ownership condition
* soft-delete condition
* special restrictions
* corresponding test

RLS must be tested with at least:

* authorized owner
* unauthenticated user
* different authenticated user
* expired or invalid public token
* soft-deleted record
* private attachment
* public-safe attachment

---

# 12. Security Requirements

Security has priority over convenience and visual polish.

Implement:

* least privilege
* server-side authorization
* client and server validation
* environment-variable validation
* no client exposure of `service_role`
* secure session handling
* safe redirect handling
* rate limiting for sensitive routes where feasible
* security headers
* Content Security Policy
* safe file uploads
* MIME and file-signature validation
* configurable upload limits
* image-dimension limits
* EXIF and GPS stripping
* signed private URLs
* short-lived public tokens
* cryptographically random share tokens
* token expiry and revocation
* output escaping
* sensitive-data redaction in logs
* dependency scanning
* secret scanning
* backup encryption or access restrictions
* documented restore procedure
* private and public storage separation
* consent and retention controls for third-party personal data

Never include customer, borrower, representative, insurance, or ID-document information in public links unless explicitly intended and authorized.

No security control may exist only in the UI.

---

# 13. Human-Computer Interaction Requirements

Apply these principles systematically:

* Nielsen’s usability heuristics
* Shneiderman’s Eight Golden Rules
* Norman’s visibility, feedback, affordance, mapping, constraints, and conceptual models
* recognition over recall
* progressive disclosure
* Fitts’s Law
* Hick’s Law
* Gestalt grouping and hierarchy
* error prevention before error messaging
* reversible actions where possible
* consistency and standards
* user control and freedom
* accessible feedback
* inclusive design
* WCAG 2.2 AA

Every major screen must define:

* user goal
* primary action
* secondary actions
* information hierarchy
* success state
* empty state
* loading state
* error state
* permission-denied state
* offline or degraded state
* keyboard interaction
* mobile interaction
* screen-reader labels
* focus order
* destructive-action recovery

Use plain workshop language. Avoid forcing users to understand database terminology.

---

# 14. UI and Visual Design System

Use the selected shadcn/ui Rhea preset as the visual foundation.

Design qualities:

* professional
* calm
* compact
* trustworthy
* industrial but not harsh
* data-dense without clutter
* readable in workshop environments
* usable on small mobile screens
* usable with one hand where practical
* clear under bright lighting
* accessible in dark mode

Maintain consistent:

* spacing
* typography
* icons
* elevation
* radii
* border treatments
* form layouts
* table behavior
* status badges
* focus indicators
* empty states
* command surfaces

Color system:

* green: completed, installed, paid, returned
* amber: pending, partial, warning
* red: blocked, unpaid, overdue, failed
* blue: ready, in stock, overpaid, informational
* violet: ordered, active motion, warranty
* gray: neutral, voided, unavailable, N/A

Color must never be the only signal. Pair color with text, iconography, shape, or pattern.

---

# 15. Interactive UI and Motion Design

The interface should feel modern and responsive without becoming distracting.

Use motion to explain:

* navigation
* state changes
* hierarchy
* reordering
* expansion
* upload progress
* save status
* success
* undo
* comparison
* chart filtering

Recommended interaction patterns:

* subtle route transitions
* shared-layout transitions where appropriate
* scroll-reveal for meaningful page sections
* sticky section headers
* scroll-progress indication for long forms
* animated number transitions on dashboards
* expandable work-order timelines
* smooth gallery and lightbox transitions
* drag-and-drop line-item feedback
* before-and-after comparison sliders
* animated filter changes
* responsive command palette
* contextual quick-action panel
* collapsible advanced fields
* skeleton-to-content transitions
* save and autosave indicators
* optimistic-update feedback
* soft-delete undo notifications

Motion constraints:

* respect `prefers-reduced-motion`
* do not animate every component
* do not delay user input
* do not create layout shifts
* avoid excessive parallax
* avoid long entrance animations
* keep common microinteractions approximately 120–250 ms
* prefer CSS and native platform capabilities
* introduce a motion library only when it provides clear value
* lazy-load heavy visual libraries
* verify keyboard and screen-reader behavior after adding motion

Create and maintain a motion design guide.

---

# 16. Surprise Experience Features

Build these when they fit the approved phase.

## Maintenance Control Center

Create an operational home screen showing:

* active work orders
* waiting approvals
* work in progress
* quality-inspection queue
* ready-for-release assets
* outstanding balances
* overdue tools
* recent evidence
* upcoming maintenance
* operational alerts

## Asset Health Ribbon

On each asset page, show:

* last service
* current meter reading
* open work orders
* lifetime maintenance cost
* repeat-issue warning
* upcoming maintenance
* evidence completeness
* warranty or comeback indicator

## Digital Evidence Storyboard

Organize evidence chronologically:

1. arrival
2. inspection
3. issue found
4. disassembly
5. replacement or repair
6. quality inspection
7. completed condition
8. release

## Command Palette

Support keyboard-first actions such as:

* create work order
* find customer
* search plate, VIN, serial, or asset code
* record payment
* upload evidence
* check out tool
* view overdue loans
* generate document

## Contextual Warnings

Examples:

* duplicate VIN, serial, or plate
* unresolved prior issue
* missing before evidence
* missing quality inspection
* invalid discount
* payment exceeding balance
* blocked borrower
* unavailable tool quantity
* overdue linked maintenance
* status transition attempted out of order

---

# 17. Performance Requirements

Performance must be measurable.

Initial budgets:

* acknowledge common interactions within approximately 100 ms
* display cached route transitions rapidly without blocking loaders
* return normal personal-use searches within approximately 300 ms where local conditions permit
* target Core Web Vitals in the good range
* avoid unnecessary client-side JavaScript
* lazy-load charts, galleries, PDF tools, OCR, and scanners
* use thumbnails in lists and galleries
* avoid loading original media until requested
* paginate or virtualize long tables
* avoid unbounded database reads
* use appropriate indexes
* debounce search responsibly
* avoid network waterfalls
* avoid duplicate requests
* define TanStack Query cache and invalidation policies
* use optimistic updates only where rollback is safe
* implement retry rules for transient failures
* implement timeouts and cancellation
* show degraded states
* preserve unsaved drafts through connectivity loss
* prevent cumulative layout shift
* analyze bundle impact after adding dependencies

Each completed phase must include:

* query review
* bundle review
* rendering review
* image-loading review
* latency observations
* performance regressions
* corrective actions

Do not claim performance compliance without evidence.

---

# 18. Reliability Requirements

Implement:

* explicit error boundaries
* recoverable form drafts
* network retry rules
* idempotent critical operations where feasible
* concurrency-safe numbering
* transaction boundaries for multi-record operations
* safe rollback behavior
* upload retry and resumability where practical
* duplicate-submission prevention
* consistent error codes
* user-visible recovery actions
* structured logs without sensitive data
* health and configuration checks
* backup monitoring
* restore testing
* migration verification

The system must fail safely.

A partial failure must not create financially inconsistent or orphaned records.

---

# 19. Documentation Requirements

Documentation is part of the feature, not an afterthought.

Maintain:

* README
* product requirements document
* architecture overview
* system context diagram
* component diagrams
* data-flow diagrams
* ERD
* data dictionary
* work-order status diagram
* payment-status diagram
* tool-loan status diagram
* folder-structure guide
* naming conventions
* environment-variable reference
* migration guide
* seed-data guide
* RLS policy matrix
* security threat model
* privacy and data-retention notes
* API and service documentation
* integration-adapter documentation
* UI design system
* motion design guide
* accessibility checklist
* performance budget
* backup and recovery guide
* deployment guide
* testing strategy
* manual testing scripts
* administrator guide
* user guide
* troubleshooting guide
* changelog
* architecture decision records
* phase-completion reports
* future roadmap
* portfolio case-study notes

Update affected documentation within the same phase and commit as the code change.

---

# 20. Testing Requirements

Use the appropriate mix of:

* unit tests
* calculation tests
* validation tests
* repository tests
* database tests
* migration tests
* RLS tests
* storage-policy tests
* integration tests
* component tests
* form tests
* end-to-end tests
* accessibility tests
* responsive tests
* performance tests
* build tests
* backup and restore tests
* manual test scripts

Critical deterministic tests include:

* job numbering
* tool-loan numbering
* line gross
* percentage and amount discounts
* grand totals
* payment status
* overpayment
* soft deletion
* status transitions
* overdue detection
* tool availability
* duplicate submission
* ownership boundaries
* private attachment access
* public-token expiry
* maintenance interval calculation

---

# 21. Development Roadmap

Complete each phase fully before starting the next.

## Phase 0 — Architecture, Security, HCI, and Engineering Foundation

* repository audit
* architecture baseline
* database baseline
* migrations
* authentication
* route protection
* RLS
* audit columns
* soft deletion
* service and repository boundaries
* query provider
* design system
* motion rules
* accessibility baseline
* error handling
* environment validation
* logging strategy
* testing foundation
* documentation foundation
* performance budgets
* threat model

## Phase 1 — Core Workshop Operations

* customer CRUD
* vehicle or asset CRUD
* work-order CRUD
* job numbering
* line items
* live calculations
* category subtotals
* overall discount
* work-order summary
* repair-status workflow
* search and filtering
* service estimate PDF
* job order PDF
* responsive experience
* draft persistence
* basic activity timeline

## Phase 2 — Inspection, Attachments, and Digital Evidence

* before, during, and after evidence
* damage evidence
* vehicle gallery
* line-item evidence
* drop-off inspection
* representatives
* authorization documents
* mobile camera capture
* compression
* EXIF removal
* thumbnail generation
* gallery
* lightbox
* comparison view
* evidence storyboard
* evidence appendix in PDFs
* private attachment controls

## Phase 3 — Payments, Insurance, Warranty, and Documents

* deposits
* partial payments
* split payments
* refunds and adjustments
* payment timeline
* balances
* insurance details
* warranty links
* comeback tracking
* void workflow
* statement of account
* payment acknowledgment
* document revision readiness

## Phase 4 — Tool Lending and Rental

* tools
* borrowers
* multi-tool loans
* QR and barcode tags
* deposits
* rental fees
* condition evidence
* returns
* overdue detection
* lost and damaged statuses
* blocklist
* consent
* restricted borrower attachments
* tool-loan slip

## Phase 5 — Analytics and Operational Intelligence

* financial analytics
* customer analytics
* vehicle and asset analytics
* parts and labor analytics
* operational analytics
* warranty and comeback analytics
* tool analytics
* receivable aging
* date and dimension filters
* CSV export
* printable reports
* metric dictionary
* data-quality checks

## Phase 6 — Preventive Maintenance and CMMS Expansion

* generic asset types
* asset hierarchy
* meter readings
* preventive schedules
* inspections
* maintenance priorities
* failure codes
* downtime
* repair duration
* quality checks
* maintenance history
* MTTR and MTBF readiness
* preventive-versus-corrective analysis

## Phase 7 — Integrations and Automation

* spreadsheet import
* historical migration
* R2 adapter
* notification adapter
* email adapter
* QR and barcode scanning
* VIN capture
* plate OCR
* scheduled backups
* calendar exports
* event and webhook readiness

## Phase 8 — Offline Reliability and Packaging

* PWA
* offline drafts
* queued uploads
* safe retry
* connectivity indicators
* sync conflict detection
* Capacitor packaging
* Tauri packaging
* platform build validation
* backup and restore validation

## Phase 9 — Advanced Intelligence

* OCR-assisted intake
* repair-summary suggestions
* service-template suggestions
* repeat-failure detection
* anomaly detection
* maintenance forecasting
* parts-demand forecasting
* natural-language analytics

AI outputs remain advisory and must never silently change operational, financial, safety, or customer records.

---

# 22. Phase Completion Gate

A phase is not complete until all applicable criteria pass:

* production build succeeds
* TypeScript passes
* ESLint passes
* automated tests pass
* critical paths pass manual testing
* migrations run on a clean database
* migration consequences are documented
* RLS is tested against authorized and unauthorized users
* storage policies are tested
* no regression is found in completed phases
* required documentation is updated
* accessibility checks pass
* responsive checks pass
* performance is reviewed
* bundle impact is reviewed
* no placeholder code remains
* no unresolved critical or high-severity security issue remains
* no unused migration or dead implementation remains
* a completion report is produced

Do not start the next phase automatically.

At the end of each phase, stop and provide the completion report for owner review.

---

# 23. Required Completion Report Format

```text
Phase:
Status: Passed / Passed with Minor Issues / Failed

Implemented:
- ...

Preserved:
- ...

Database Changes:
- ...

Security Validation:
- ...

RLS Validation:
- ...

Testing:
- ...

Accessibility:
- ...

Performance:
- ...

Documentation Updated:
- ...

Known Limitations:
- ...

Remaining Non-Critical TODOs:
- ...

Blocking Issues:
- ...

Recommended Next Action:
- ...
```

---

# 24. Immediate Instruction

Read this master specification and treat it as the project constitution.

Do not implement later-phase features yet.

Wait for the corresponding phase execution prompt.

When a phase prompt is provided:

1. inspect the existing implementation
2. compare it against the master specification
3. write a concise implementation plan
4. identify risks and migrations
5. implement only the approved phase scope
6. test and document the work
7. produce the required completion report
8. stop before the next phase
