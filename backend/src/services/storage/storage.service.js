const fs = require('fs').promises;
const path = require('path');

const TYPE = process.env.STORAGE_TYPE || 'local';

let supabase;
let bucket;

if (TYPE === 'supabase') {
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  bucket = process.env.SUPABASE_BUCKET || 'photos';
}

async function upload(buffer, storagePath, contentType = 'image/webp') {
  if (TYPE === 'supabase') {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, buffer, { contentType, upsert: true });
    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    return data.publicUrl;
  }

  // local: write buffer to uploads dir
  const dest = path.join(process.env.UPLOADS_DIR || './uploads', storagePath);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buffer);
  return storagePath;
}

async function remove(keyOrUrl) {
  if (TYPE === 'supabase') {
    // Extract path after bucket name from public URL
    const marker = `/object/public/${bucket}/`;
    const idx = keyOrUrl.indexOf(marker);
    const filePath = idx !== -1 ? keyOrUrl.slice(idx + marker.length) : keyOrUrl;
    await supabase.storage.from(bucket).remove([filePath]);
    return;
  }

  try {
    const dest = path.join(process.env.UPLOADS_DIR || './uploads', keyOrUrl);
    await fs.unlink(dest);
  } catch { /* ignore missing file */ }
}

// Returns true when storage_key is already a full URL (Supabase mode)
function isFullUrl(key) {
  return key && (key.startsWith('http://') || key.startsWith('https://'));
}

module.exports = { upload, remove, isFullUrl, TYPE };
