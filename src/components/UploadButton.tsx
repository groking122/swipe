'use client'
import { createClientComponentClient } from '@supabase/supabase-js'

export function UploadButton() {
  const supabase = createClientComponentClient()

  const handleUpload = async (file: File) => {
    const { data, error } = await supabase.storage
      .from('memes')
      .upload(`user-${Date.now()}`, file)

    if (!error) {
      await supabase
        .from('memes')
        .insert({ image_path: data.path })
    }
  }

  return (
    <input
      type="file"
      accept="image/*"
      onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
    />
  )
}