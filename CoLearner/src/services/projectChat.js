import { supabase, result, viewerId } from './supabase/client'

const messageFields =
  '*,sender:profiles!project_messages_sender_id_fkey(id,username,full_name,avatar)'
export const projectChat = {
  inbox: () => result(supabase.rpc('colearn_project_inbox')),
  history: async (project, before) => {
    let query = supabase
      .from('project_messages')
      .select(messageFields)
      .eq('project_id', project)
      .order('id', { ascending: false })
      .limit(50)
    if (before) query = query.lt('id', before)
    const items = (await result(query)).reverse()
    const ids = [
      ...new Set(items.map((item) => item.reply_to_id).filter(Boolean)),
    ]
    const originals = ids.length
      ? await result(
          supabase
            .from('project_messages')
            .select(messageFields)
            .eq('project_id', project)
            .in('id', ids),
        )
      : []
    return items.map((item) => ({
      ...item,
      reply:
        originals.find((original) => original.id === item.reply_to_id) || null,
    }))
  },
  send: async (project, body, reply, clientId) => {
    const sender = await viewerId()
    const response = await supabase
      .from('project_messages')
      .insert({
        project_id: project,
        sender_id: sender,
        body: body.trim(),
        reply_to_id: reply || null,
        client_id: clientId,
      })
      .select()
      .single()
    if (response.error?.code === '23505') {
      const saved = await result(
        supabase
          .from('project_messages')
          .select('*')
          .eq('sender_id', sender)
          .eq('client_id', clientId)
          .single(),
      )
      if (
        saved.project_id === Number(project) &&
        saved.body === body.trim() &&
        saved.reply_to_id === (reply || null)
      )
        return saved
    }
    return result(Promise.resolve(response))
  },
  read: (project, through) =>
    result(
      supabase.rpc('colearn_read_project', {
        project: Number(project),
        through_id: through,
      }),
    ),
}
