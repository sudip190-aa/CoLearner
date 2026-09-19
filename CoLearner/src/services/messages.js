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
  send: async (peer, body, id = crypto.randomUUID()) => {
    const sender = await viewerId()
    const response = await supabase
      .from('direct_messages')
      .insert({
        id,
        sender_id: sender,
        recipient_id: peer,
        body: body.trim(),
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
        saved.body === body.trim()
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
