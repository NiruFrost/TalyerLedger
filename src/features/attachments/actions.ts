import { createClient } from '@/lib/supabase/client'
import type { Attachment, AttachmentInsert, AttachmentUpdate, AttachmentParentType, AttachmentCategory } from '@/lib/types'

const ATTACHMENT_SELECT = '*'

export async function getAttachments(parentType: AttachmentParentType, parentId: string): Promise<Attachment[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('attachments')
    .select(ATTACHMENT_SELECT)
    .eq('parent_type', parentType)
    .eq('parent_id', parentId)
    .is('deleted_at', null)
    .order('taken_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as Attachment[]
}

export async function getAttachmentsByCategory(parentType: AttachmentParentType, parentId: string): Promise<Record<AttachmentCategory, Attachment[]>> {
  const all = await getAttachments(parentType, parentId)
  const grouped: Record<string, Attachment[]> = {}
  for (const a of all) {
    const cat = a.attachment_type
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(a)
  }
  return grouped as Record<AttachmentCategory, Attachment[]>
}

export async function getAttachmentById(id: string): Promise<Attachment | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('attachments')
    .select(ATTACHMENT_SELECT)
    .eq('id', id)
    .single()
  if (error) return null
  return data as unknown as Attachment
}

export async function createAttachment(data: AttachmentInsert): Promise<Attachment> {
  const supabase = createClient()
  const { data: created, error } = await supabase
    .from('attachments')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return created as unknown as Attachment
}

export async function updateAttachment(id: string, data: AttachmentUpdate): Promise<Attachment> {
  const supabase = createClient()
  const { data: updated, error } = await supabase
    .from('attachments')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return updated as unknown as Attachment
}

export async function deleteAttachment(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('attachments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function setVehicleCoverPhoto(vehicleId: string, attachmentId: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('vehicles').update({ cover_photo: attachmentId }).eq('id', vehicleId)
}

export async function createAttachmentAndLog(
  data: AttachmentInsert,
  logDescription: string,
): Promise<Attachment> {
  const attachment = await createAttachment(data)
  const supabase = createClient()
  await supabase.from('activity_logs').insert({
    work_order_id: data.parent_type === 'work_order' ? data.parent_id : null,
    event_type: 'attachment_added',
    description: logDescription,
    metadata: { attachment_id: attachment.id, category: data.attachment_type },
  })
  return attachment
}
