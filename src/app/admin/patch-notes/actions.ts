'use server'

import { fetchPatchNotesFromApi, savePatchNotes } from '@/lib/patchNotes'
import { setCacheMeta } from '@/lib/cacheMeta'

export async function refreshPatchNotes() {
  const items = await fetchPatchNotesFromApi()
  await savePatchNotes(items)
  await setCacheMeta('patch_notes', new Date(), items.length)
  return { count: items.length }
}

