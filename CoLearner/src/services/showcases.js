import { result, supabase, upload, viewerId } from './supabase/client'

export const showcases = {
  list: async (userId) => {
    const items = await result(
      supabase
        .from('profile_showcases')
        .select('*')
        .eq('user_id', userId)
        .order('position')
        .order('created_at', { ascending: false })
        .order('id'),
    )
    return Promise.all(
      items.map(async (item) => {
        const response = item.image_path
          ? await supabase.storage
              .from('showcase-images')
              .createSignedUrl(item.image_path, 3600)
          : null
        return { ...item, imageUrl: response?.data?.signedUrl || '' }
      }),
    )
  },
  save: async (draft, file, existing) => {
    let uploaded
    const id = existing?.id || draft.id
    const current = await result(
      supabase.from('profile_showcases').select('*').eq('id', id).maybeSingle(),
    )
    try {
      if (file) {
        const image = await window.createImageBitmap(file).catch(() => {
          throw new Error('This image cannot be opened. Choose another file.')
        })
        const pixels = image.width * image.height
        image.close()
        if (pixels > 24000000)
          throw new Error('Choose an image smaller than 24 megapixels.')
        uploaded = await upload(
          'showcase-images',
          file,
          `${await viewerId()}/${id}`,
        )
      }
      const fields = {
        title: draft.title.trim(),
        description: draft.description.trim(),
        live_url: draft.live_url.trim(),
        repository_url: draft.repository_url.trim(),
        image_path:
          uploaded || (draft.removeImage ? null : current?.image_path) || null,
      }
      const saved = await result(
        current
          ? supabase
              .from('profile_showcases')
              .update(fields)
              .eq('id', id)
              .select()
              .single()
          : supabase
              .from('profile_showcases')
              .insert({ id, ...fields })
              .select()
              .single(),
      )
      if (current?.image_path && fields.image_path !== current.image_path)
        await supabase.storage
          .from('showcase-images')
          .remove([current.image_path])
      return saved
    } catch (error) {
      // Storage RLS only discards unreferenced files, including on an ambiguous save response.
      if (uploaded)
        await supabase.storage.from('showcase-images').remove([uploaded])
      throw error
    }
  },
  remove: async (item) => {
    await result(
      supabase
        .from('profile_showcases')
        .delete()
        .eq('id', item.id)
        .select()
        .single(),
    )
    if (item.image_path)
      await supabase.storage.from('showcase-images').remove([item.image_path])
  },
}
