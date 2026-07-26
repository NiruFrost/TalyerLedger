import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const USER_A = '11111111-1111-4111-8111-111111111111'
const USER_B = '22222222-2222-4222-8222-222222222222'
const USER_C = '33333333-3333-4333-8333-333333333333'

let db: PGlite

async function setRole(role: 'anon' | 'authenticated', userId?: string) {
  await db.exec('RESET ROLE')
  await db.query(`SELECT set_config('request.jwt.claim.sub', $1, false)`, [userId ?? ''])
  await db.query(`SELECT set_config('request.jwt.claim.role', $1, false)`, [role])
  await db.exec(`SET ROLE ${role}`)
}

async function resetRole() {
  await db.exec('RESET ROLE')
  await db.query(`SELECT set_config('request.jwt.claim.sub', '', false)`)
  await db.query(`SELECT set_config('request.jwt.claim.role', '', false)`)
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(`
    CREATE ROLE anon NOLOGIN;
    CREATE ROLE authenticated NOLOGIN;
    CREATE ROLE service_role NOLOGIN BYPASSRLS;

    CREATE SCHEMA auth;
    CREATE TABLE auth.users (
      id UUID PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      raw_user_meta_data JSONB NOT NULL DEFAULT '{}'::jsonb
    );
    CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$
      SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID;
    $$;
    CREATE FUNCTION auth.role() RETURNS TEXT LANGUAGE sql STABLE AS $$
      SELECT NULLIF(current_setting('request.jwt.claim.role', true), '');
    $$;

    CREATE SCHEMA storage;
    CREATE TABLE storage.buckets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      public BOOLEAN NOT NULL DEFAULT false,
      file_size_limit BIGINT,
      allowed_mime_types TEXT[]
    );
    CREATE TABLE storage.objects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bucket_id TEXT NOT NULL REFERENCES storage.buckets(id),
      name TEXT NOT NULL,
      owner_id UUID,
      metadata JSONB
    );
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    CREATE FUNCTION storage.foldername(path TEXT) RETURNS TEXT[] LANGUAGE sql IMMUTABLE AS $$
      SELECT string_to_array(path, '/');
    $$;
  `)

  const migrationDirectory = resolve(process.cwd(), 'src/db/migrations')
  const migrations = readdirSync(migrationDirectory).filter((file) => file.endsWith('.sql')).sort()
  for (const migration of migrations) {
    try {
      await db.exec(readFileSync(resolve(migrationDirectory, migration), 'utf8'))
    } catch (error) {
      throw new Error(`Migration ${migration} failed`, { cause: error })
    }
  }

  await db.exec(`
    GRANT USAGE ON SCHEMA public, auth, storage TO anon, authenticated;
    GRANT EXECUTE ON FUNCTION auth.uid(), auth.role() TO anon, authenticated;
    GRANT SELECT ON ALL TABLES IN SCHEMA public, storage TO anon, authenticated;
    GRANT INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
  `)

  await db.query('INSERT INTO auth.users (id) VALUES ($1), ($2), ($3)', [USER_A, USER_B, USER_C])
})

afterAll(async () => {
  await resetRole()
  await db.close()
})

describe('clean migration chain', () => {
  it('creates all Phase 0 ownership policies and a private attachment bucket', async () => {
    const policies = await db.query<{ count: number }>(`
      SELECT count(*)::int AS count
      FROM pg_policies
      WHERE schemaname = 'public' AND policyname LIKE '%_select'
    `)
    const bucket = await db.query<{ public: boolean; file_size_limit: number }>(`
      SELECT public, file_size_limit FROM storage.buckets WHERE id = 'attachments'
    `)

    expect(policies.rows[0].count).toBeGreaterThanOrEqual(16)
    expect(bucket.rows[0]).toMatchObject({ public: false, file_size_limit: 10_485_760 })
  })

  it('isolates active records by authenticated workshop ownership', async () => {
    await setRole('authenticated', USER_A)
    const created = await db.query<{ id: string; workshop_id: string }>(`
      INSERT INTO customers (name) VALUES ('Owner A Customer')
      RETURNING id, workshop_id
    `)
    const customerId = created.rows[0].id
    const workshopA = created.rows[0].workshop_id

    await setRole('authenticated', USER_B)
    const hidden = await db.query(`SELECT id FROM customers WHERE id = $1`, [customerId])
    const changed = await db.query(`
      UPDATE customers SET name = 'Cross-tenant edit' WHERE id = $1 RETURNING id
    `, [customerId])
    expect(hidden.rows).toHaveLength(0)
    expect(changed.rows).toHaveLength(0)

    await setRole('authenticated', USER_A)
    const softDeleted = await db.query<{ soft_delete_record: boolean }>(
      `SELECT soft_delete_record('customers', $1)`,
      [customerId],
    )
    const deleted = await db.query(`SELECT id FROM customers WHERE id = $1`, [customerId])
    expect(softDeleted.rows[0].soft_delete_record).toBe(true)
    expect(deleted.rows).toHaveLength(0)

    const restored = await db.query<{ restore_record: boolean }>(
      `SELECT restore_record('customers', $1)`,
      [customerId],
    )
    expect(restored.rows[0].restore_record).toBe(true)
    expect((await db.query(`SELECT id FROM customers WHERE id = $1`, [customerId])).rows).toHaveLength(1)

    await resetRole()
    const stored = await db.query<{ workshop_id: string }>(`SELECT workshop_id FROM customers WHERE id = $1`, [customerId])
    expect(stored.rows[0].workshop_id).toBe(workshopA)
  })

  it('denies anonymous access and cross-workshop foreign-key bypasses', async () => {
    await setRole('authenticated', USER_A)
    const customerA = await db.query<{ id: string }>(`
      INSERT INTO customers (name) VALUES ('Protected Parent') RETURNING id
    `)

    await setRole('authenticated', USER_B)
    await expect(db.query(`
      INSERT INTO vehicles (customer_id, make, model, year)
      VALUES ($1, 'Test', 'Cross Tenant', 2026)
    `, [customerA.rows[0].id])).rejects.toThrow()

    await setRole('anon')
    const anonymousRows = await db.query('SELECT id FROM customers')
    expect(anonymousRows.rows).toHaveLength(0)
    await expect(db.query(`INSERT INTO customers (name) VALUES ('Anonymous write')`)).rejects.toThrow()
  })

  it('restricts attachment metadata and storage objects to the owning workshop', async () => {
    await setRole('authenticated', USER_A)
    const vehicle = await db.query<{ id: string; workshop_id: string }>(`
      INSERT INTO vehicles (make, model, year) VALUES ('Test', 'Asset', 2026)
      RETURNING id, workshop_id
    `)
    const attachment = await db.query<{ id: string }>(`
      INSERT INTO attachments (
        parent_type, parent_id, attachment_type, file_kind, storage_path, mime_type, visibility
      ) VALUES ('vehicle', $1, 'other', 'image', $2, 'image/jpeg', 'private')
      RETURNING id
    `, [vehicle.rows[0].id, `${vehicle.rows[0].workshop_id}/vehicle/${vehicle.rows[0].id}/evidence.jpg`])
    const customerSafeAttachment = await db.query<{ id: string }>(`
      INSERT INTO attachments (
        parent_type, parent_id, attachment_type, file_kind, storage_path, mime_type, visibility
      ) VALUES ('vehicle', $1, 'after', 'image', $2, 'image/jpeg', 'customer')
      RETURNING id
    `, [vehicle.rows[0].id, `${vehicle.rows[0].workshop_id}/vehicle/${vehicle.rows[0].id}/customer-safe.jpg`])
    await db.query(`
      INSERT INTO workshop_members (workshop_id, user_id, role)
      VALUES ($1, $2, 'member')
    `, [vehicle.rows[0].workshop_id, USER_C])

    await resetRole()
    await db.query(`
      INSERT INTO storage.objects (bucket_id, name)
      VALUES ('attachments', $1), ('attachments', $2)
    `, [
      `${vehicle.rows[0].workshop_id}/vehicle/${vehicle.rows[0].id}/evidence.jpg`,
      `${vehicle.rows[0].workshop_id}/vehicle/${vehicle.rows[0].id}/customer-safe.jpg`,
    ])

    await setRole('authenticated', USER_B)
    const hiddenMetadata = await db.query('SELECT id FROM attachments WHERE id = $1', [attachment.rows[0].id])
    const hiddenCustomerSafe = await db.query('SELECT id FROM attachments WHERE id = $1', [customerSafeAttachment.rows[0].id])
    const hiddenObject = await db.query(`SELECT name FROM storage.objects WHERE bucket_id = 'attachments'`)
    expect(hiddenMetadata.rows).toHaveLength(0)
    expect(hiddenCustomerSafe.rows).toHaveLength(0)
    expect(hiddenObject.rows).toHaveLength(0)

    await setRole('authenticated', USER_A)
    const visibleObject = await db.query(`SELECT name FROM storage.objects WHERE bucket_id = 'attachments'`)
    expect(visibleObject.rows).toHaveLength(2)

    await setRole('authenticated', USER_C)
    const memberMetadata = await db.query<{ id: string }>('SELECT id FROM attachments ORDER BY id')
    const memberObjects = await db.query<{ name: string }>(`SELECT name FROM storage.objects ORDER BY name`)
    expect(memberMetadata.rows.map((row) => row.id)).toEqual([customerSafeAttachment.rows[0].id])
    expect(memberObjects.rows.map((row) => row.name)).toEqual([
      `${vehicle.rows[0].workshop_id}/vehicle/${vehicle.rows[0].id}/customer-safe.jpg`,
    ])
    await expect(db.query(`
      INSERT INTO attachments (
        parent_type, parent_id, attachment_type, file_kind, storage_path, mime_type, visibility
      ) VALUES ('vehicle', $1, 'other', 'image', $2, 'image/jpeg', 'private')
    `, [
      vehicle.rows[0].id,
      `${vehicle.rows[0].workshop_id}/vehicle/${vehicle.rows[0].id}/member-private.jpg`,
    ])).rejects.toThrow()

    await setRole('authenticated', USER_A)
    await expect(db.query(`
      INSERT INTO attachments (
        parent_type, parent_id, attachment_type, file_kind, storage_path, mime_type, visibility
      ) VALUES ('vehicle', $1, 'other', 'image', $2, 'image/jpeg', 'workshop')
    `, [vehicle.rows[0].id, `${vehicle.rows[0].workshop_id}/vehicle/wrong-parent/evidence.jpg`]))
      .rejects.toThrow('storage path does not match')
    await expect(db.query(`
      INSERT INTO attachments (
        parent_type, parent_id, attachment_type, file_kind, storage_path, mime_type, visibility
      ) VALUES ('vehicle', $1, 'other', 'image', $2, 'image/jpeg', 'workshop')
    `, [
      vehicle.rows[0].id,
      `${vehicle.rows[0].workshop_id}/vehicle/${vehicle.rows[0].id}/customer-safe.jpg`,
    ])).rejects.toThrow()
  })

  it('derives paid and overpaid status from discounted totals in the database', async () => {
    await setRole('authenticated', USER_A)
    const vehicle = await db.query<{ id: string }>(`
      INSERT INTO vehicles (make, model, year) VALUES ('Finance', 'Fixture', 2026) RETURNING id
    `)
    const workOrder = await db.query<{ id: string }>(`
      SELECT create_work_order_with_items(
        jsonb_build_object(
          'vehicle_id', $1::text,
          'status', 'draft',
          'currency', 'PHP',
          'overall_discount_type', 'percent',
          'overall_discount_value', 10
        ),
        '[]'::jsonb
      ) AS id
    `, [vehicle.rows[0].id])
    await db.query(`
      INSERT INTO line_items (
        work_order_id, category, item, quantity, unit, unit_price, line_total,
        discount_type, discount_value
      ) VALUES ($1, 'parts', 'Discounted part', 2, 'pc', 100, 1, 'percent', 10)
    `, [workOrder.rows[0].id])
    expect((await db.query<{ line_total: string }>(
      `SELECT line_total::text FROM line_items WHERE work_order_id = $1`,
      [workOrder.rows[0].id],
    )).rows[0].line_total).toBe('200.00')

    const payment = await db.query<{ id: string }>(`
      INSERT INTO payments (work_order_id, amount) VALUES ($1, 162) RETURNING id
    `, [workOrder.rows[0].id])
    expect((await db.query<{ payment_status: string }>(
      'SELECT payment_status FROM work_orders WHERE id = $1',
      [workOrder.rows[0].id],
    )).rows[0].payment_status).toBe('paid')

    const extra = await db.query<{ id: string }>(`
      INSERT INTO payments (work_order_id, amount) VALUES ($1, 1) RETURNING id
    `, [workOrder.rows[0].id])
    expect((await db.query<{ payment_status: string }>(
      'SELECT payment_status FROM work_orders WHERE id = $1',
      [workOrder.rows[0].id],
    )).rows[0].payment_status).toBe('overpaid')

    await db.query(`SELECT soft_delete_record('payments', $1)`, [extra.rows[0].id])
    expect((await db.query<{ payment_status: string }>(
      'SELECT payment_status FROM work_orders WHERE id = $1',
      [workOrder.rows[0].id],
    )).rows[0].payment_status).toBe('paid')
    expect(payment.rows).toHaveLength(1)

    await expect(db.query(`
      UPDATE work_orders SET payment_status = 'unpaid' WHERE id = $1
    `, [workOrder.rows[0].id])).rejects.toThrow('payment status is derived')
  })

  it('creates, updates, and copies work orders transactionally with version checks', async () => {
    await setRole('authenticated', USER_A)
    const vehicle = await db.query<{ id: string }>(`
      INSERT INTO vehicles (make, model, year) VALUES ('RPC', 'Fixture', 2026) RETURNING id
    `)
    const orderPayload = JSON.stringify({
      vehicle_id: vehicle.rows[0].id,
      status: 'draft',
      currency: 'PHP',
      date: '2026-07-23',
      overall_discount_value: 0,
    })
    const itemPayload = JSON.stringify([
      {
        category: 'labor',
        item: 'Inspection',
        quantity: 1,
        unit: 'service',
        unit_price: 100,
        discount_value: 0,
        sort_order: 0,
      },
    ])
    const created = await db.query<{ id: string }>(`
      SELECT create_work_order_with_items($1::jsonb, $2::jsonb) AS id
    `, [orderPayload, itemPayload])
    const orderId = created.rows[0].id
    const originalItem = await db.query<{ id: string }>(`
      SELECT id FROM line_items WHERE work_order_id = $1
    `, [orderId])
    expect(originalItem.rows).toHaveLength(1)

    const updatedItems = JSON.stringify([
      {
        id: originalItem.rows[0].id,
        category: 'labor',
        item: 'Detailed inspection',
        quantity: 1,
        unit: 'service',
        unit_price: 120,
        discount_value: 0,
        sort_order: 0,
      },
    ])
    await db.query(`
      SELECT update_work_order_with_items($1, 1, $2::jsonb, $3::jsonb)
    `, [orderId, JSON.stringify({ ...JSON.parse(orderPayload), status: 'estimate' }), updatedItems])
    const updated = await db.query<{ status: string; version: number; item: string }>(`
      SELECT w.status::text AS status, w.version, li.item
      FROM work_orders w
      JOIN line_items li ON li.work_order_id = w.id AND li.deleted_at IS NULL
      WHERE w.id = $1
    `, [orderId])
    expect(updated.rows[0]).toMatchObject({ status: 'estimate', version: 2, item: 'Detailed inspection' })

    const transitioned = await db.query<{ version: number }>(`
      SELECT transition_work_order_status($1, 2, 'approved') AS version
    `, [orderId])
    expect(transitioned.rows[0].version).toBe(3)
    await expect(db.query(`
      SELECT transition_work_order_status($1, 2, 'in_progress')
    `, [orderId])).rejects.toThrow('refresh before changing status')

    await expect(db.query(`
      UPDATE work_orders SET status = 'released' WHERE id = $1
    `, [orderId])).rejects.toThrow('invalid work order status transition')

    await expect(db.query(`
      SELECT update_work_order_with_items($1, 1, $2::jsonb, $3::jsonb)
    `, [orderId, orderPayload, updatedItems])).rejects.toThrow('refresh before saving')

    const copied = await db.query<{ id: string }>(`
      SELECT copy_work_order_transactional($1) AS id
    `, [orderId])
    const copiedRows = await db.query<{ status: string; item_count: number }>(`
      SELECT w.status::text AS status, count(li.id)::int AS item_count
      FROM work_orders w
      LEFT JOIN line_items li ON li.work_order_id = w.id AND li.deleted_at IS NULL
      WHERE w.id = $1
      GROUP BY w.status
    `, [copied.rows[0].id])
    expect(copiedRows.rows[0]).toEqual({ status: 'draft', item_count: 1 })

    const directNumber = await db.query<{ value: string }>('SELECT next_work_order_number() AS value')
    await expect(db.query(`
      INSERT INTO work_orders (estimate_no, vehicle_id)
      VALUES ($1, $2)
    `, [directNumber.rows[0].value, vehicle.rows[0].id])).rejects.toThrow()
    await expect(db.query(`
      SELECT create_work_order_with_items($1::jsonb, '[]'::jsonb)
    `, [JSON.stringify({ ...JSON.parse(orderPayload), status: 'released' })]))
      .rejects.toThrow('must start in draft')
    await expect(db.query(`
      UPDATE work_orders SET estimate_no = $2 WHERE id = $1
    `, [orderId, directNumber.rows[0].value])).rejects.toThrow('number is immutable')
  })

  it('enforces soft-delete boundaries across operational parents and children', async () => {
    await setRole('authenticated', USER_B)
    const vehicle = await db.query<{ id: string }>(`
      INSERT INTO vehicles (make, model, year) VALUES ('Delete', 'Boundary', 2026) RETURNING id
    `)
    const created = await db.query<{ id: string }>(`
      SELECT create_work_order_with_items(
        jsonb_build_object('vehicle_id', $1::text, 'status', 'draft'),
        '[{"category":"labor","item":"Boundary test","quantity":1,"unit":"service","unit_price":10,"discount_value":0}]'::jsonb
      ) AS id
    `, [vehicle.rows[0].id])
    const orderId = created.rows[0].id
    const item = await db.query<{ id: string }>(
      `SELECT id FROM line_items WHERE work_order_id = $1`,
      [orderId],
    )

    await expect(db.query(`
      UPDATE work_orders SET deleted_at = now() WHERE id = $1
    `, [orderId])).rejects.toThrow()

    await db.query(`SELECT soft_delete_record('line_items', $1)`, [item.rows[0].id])
    await db.query(`SELECT soft_delete_record('work_orders', $1)`, [orderId])
    expect((await db.query(`SELECT id FROM line_items WHERE id = $1`, [item.rows[0].id])).rows)
      .toHaveLength(0)
    await expect(db.query(`SELECT restore_record('line_items', $1)`, [item.rows[0].id]))
      .rejects.toThrow('parent is unavailable')

    await db.query(`SELECT restore_record('work_orders', $1)`, [orderId])
    await db.query(`SELECT restore_record('line_items', $1)`, [item.rows[0].id])
    expect((await db.query(`SELECT id FROM line_items WHERE id = $1`, [item.rows[0].id])).rows)
      .toHaveLength(1)
    await expect(db.query(`SELECT soft_delete_record('vehicles', $1)`, [vehicle.rows[0].id]))
      .rejects.toThrow('active work orders')
  })

  it('uses restrictive hard-delete actions for operational and audit relationships', async () => {
    await resetRole()
    const constraints = await db.query<{ conname: string; confdeltype: string }>(`
      SELECT conname, confdeltype
      FROM pg_constraint
      WHERE conname = ANY (ARRAY[
        'line_items_work_order_id_fkey',
        'photos_vehicle_id_fkey',
        'photos_work_order_id_fkey',
        'photos_line_item_id_fkey',
        'documents_work_order_id_fkey',
        'activity_logs_work_order_id_fkey',
        'notifications_work_order_id_fkey',
        'package_items_package_id_fkey'
      ])
      ORDER BY conname
    `)
    expect(constraints.rows).toHaveLength(8)
    expect(constraints.rows.every((row) => row.confdeltype === 'r')).toBe(true)
  })

  it('allocates immutable-format work order numbers independently per workshop', async () => {
    await setRole('authenticated', USER_A)
    const workshopA = await db.query<{ id: string }>('SELECT current_workshop_id() AS id')
    const [first, second] = await Promise.all([
      db.query<{ value: string }>('SELECT next_work_order_number() AS value'),
      db.query<{ value: string }>('SELECT next_work_order_number() AS value'),
    ])
    expect(first.rows[0].value).toMatch(/^\d{2}-\d{4}-\d{6}$/)
    expect(second.rows[0].value).toMatch(/^\d{2}-\d{4}-\d{6}$/)
    expect(new Set([first.rows[0].value, second.rows[0].value]).size).toBe(2)

    await setRole('authenticated', USER_B)
    const workshopB = await db.query<{ id: string }>('SELECT current_workshop_id() AS id')
    const otherWorkshop = await db.query<{ value: string }>('SELECT next_work_order_number() AS value')
    expect(otherWorkshop.rows[0].value).toMatch(/^\d{2}-\d{4}-\d{6}$/)

    await resetRole()
    const counters = await db.query<{ workshop_id: string; last_value: number }>(`
      SELECT workshop_id, last_value
      FROM work_order_number_counters
      WHERE workshop_id = ANY ($1::uuid[])
    `, [[workshopA.rows[0].id, workshopB.rows[0].id]])
    const byWorkshop = new Map(counters.rows.map((row) => [row.workshop_id, row.last_value]))
    expect(byWorkshop.get(workshopA.rows[0].id)).toBe(
      Math.max(Number(first.rows[0].value.slice(-6)), Number(second.rows[0].value.slice(-6))),
    )
    expect(byWorkshop.get(workshopB.rows[0].id)).toBe(Number(otherWorkshop.rows[0].value.slice(-6)))
  })
})
