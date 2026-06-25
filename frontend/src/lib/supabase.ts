import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, key)

export async function uploadToStorage(
  blob: Blob,
  path: string,
): Promise<string> {
  const { error } = await supabase.storage
    .from('photos')
    .upload(path, blob, { contentType: blob.type || 'image/webp', upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('photos').getPublicUrl(path)
  return data.publicUrl
}
