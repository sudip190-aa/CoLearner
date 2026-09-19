import { supabase, result, mediaUrl, viewerId } from './supabase/client'

export const messages = {
  contacts: async () => {
    const contacts = await result(supabase.rpc('colearn_message_contacts'))
    return Promise.all(
      contacts.map(async (p) => ({
        ...p,
        avatar: await mediaUrl('avatars', p.avatar),
        unread_count: Number(p.unread_count),
      })),
    )
  },
  history: async (peer, before) => {
    const me = await viewerId()
    let query = supabase
      .from('direct_messages')
      .select('*')
      .or(
        `and(sender_id.eq.${me},recipient_id.eq.${peer}),and(sender_id.eq.${peer},recipient_id.eq.${me})`,
      )
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(50)
    if (before)
      query = query.or(
        `created_at.lt.${before.created_at},and(created_at.eq.${before.created_at},id.lt.${before.id})`,
      )
    return (await result(query)).reverse()
  },
  uploadImage: async (peer, file, id) => {
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    )
      throw new Error('Choose one JPEG, PNG or WebP image under 5 MB.')
    // Decode before upload; do not trust a renamed file or its supplied MIME type.
    const bitmap = await window.createImageBitmap(file).catch(() => {
      throw new Error('This image cannot be opened. Choose another file.')
    })
    if (bitmap.width * bitmap.height > 24000000) {
      bitmap.close()
      throw new Error('Choose an image smaller than 24 megapixels.')
    }
    bitmap.close()
    const sender = await viewerId()
    const path = `${sender}/${peer}/${id}.${{ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type]}`
    const response = await supabase.storage
      .from('chat-images')
      .upload(path, file, { upsert: false, contentType: file.type })
    if (
      response.error &&
      response.error.statusCode !== '409' &&
      response.error.statusCode !== 409
    )
      throw new Error(response.error.message)
    return path
  },
  uploadAudio: async (peer, blob, id, durationMs) => {
    const extension = {
      'audio/webm': 'webm',
      'audio/mp4': 'm4a',
      'audio/ogg': 'ogg',
    }[blob.type]
    if (
      !extension ||
      !blob.size ||
      blob.size > 5 * 1024 * 1024 ||
      !Number.isInteger(durationMs) ||
      durationMs < 1 ||
      durationMs > 120000
    )
      throw new Error('Record a voice message up to two minutes and 5 MB.')
    const sender = await viewerId()
    const path = `${sender}/${peer}/${id}.${extension}`
    const { error } = await supabase.storage
      .from('chat-audio')
      .upload(path, blob, { upsert: false, contentType: blob.type })
    if (error && String(error.statusCode) !== '409')
      throw new Error(error.message)
    return path
  },
  discardAudio: (path) => supabase.storage.from('chat-audio').remove([path]),
  send: async (
    peer,
    body,
    id = crypto.randomUUID(),
    imagePath = null,
    audio = null,
  ) => {
    const sender = await viewerId()
    const response = await supabase
      .from('direct_messages')
      .insert({
        id,
        sender_id: sender,
        recipient_id: peer,
        body: body.trim(),
        image_path: imagePath,
        audio_path: audio?.path || null,
        audio_duration_ms: audio?.durationMs || null,
      })
      .select()
      .single()
    // A lost response can be retried without creating a duplicate message.
    if (response.error?.code === '23505') {
      const saved = await result(
        supabase.from('direct_messages').select('*').eq('id', id).single(),
      )
      if (
        saved.sender_id === sender &&
        saved.recipient_id === peer &&
        saved.body === body.trim() &&
        saved.image_path === imagePath &&
        saved.audio_path === (audio?.path || null) &&
        saved.audio_duration_ms === (audio?.durationMs || null)
      )
        return saved
    }
    return result(Promise.resolve(response))
  },
  read: (peer, through) =>
    result(
      supabase.rpc('colearn_read_messages', { peer, through_at: through }),
    ),
  subscribe: (me, refresh, status) => {
    const channel = supabase
      .channel(`messages:${me}:${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages',
          filter: `recipient_id=eq.${me}`,
        },
        refresh,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages',
          filter: `sender_id=eq.${me}`,
        },
        refresh,
      )
      .subscribe((state) => status?.(state === 'SUBSCRIBED'))
    return () => {
      void supabase.removeChannel(channel)
    }
  },
}
