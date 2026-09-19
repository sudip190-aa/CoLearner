import { createClient } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
if (!url || !key)
  throw new Error(
    'Supabase public configuration is missing. See CoLearner/.env.example.',
  )
export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})
export const result = async (query) => {
  const { data, error } = await query
  if (error) {
    const e = new Error(error.message || 'The request failed.')
    e.code = error.code
    e.fields = {}
    throw e
  }
  return data
}
export const action = (name, payload = {}) =>
  result(supabase.rpc('colearn_action', { action: name, payload }))
export const session = async () =>
  (await result(supabase.auth.getSession()))?.session
export const viewerId = async () => (await session())?.user?.id
export const rows = async (table, select = '*', filters = {}) => {
  const items = []
  for (let start = 0; ; start += 500) {
    let query = supabase
      .from(table)
      .select(select)
      .range(start, start + 499)
    const order =
      table === 'thread_tags'
        ? ['thread_id', 'tag_id']
        : table === 'thread_views'
          ? ['thread_id', 'user_id', 'viewed_on']
          : ['id']
    for (const column of order) query = query.order(column)
    for (const [key, value] of Object.entries(filters))
      query = query.eq(key, value)
    const batch = await result(query)
    items.push(...batch)
    if (batch.length < 500) return items
  }
}
export const one = (table, key, value, select = '*') =>
  result(supabase.from(table).select(select).eq(key, value).single())
export const insert = (table, body) =>
  result(supabase.from(table).insert(body).select().single())
export const update = (table, id, body) =>
  result(supabase.from(table).update(body).eq('id', id).select().single())
export const remove = (table, id) =>
  result(supabase.from(table).delete().eq('id', id))
export const slug = (title) =>
  `${
    String(title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 160) || 'item'
  }-${crypto.randomUUID().slice(0, 8)}`
export const edge = async (name, body, timeout) => {
  const { data, error } = await supabase.functions.invoke(name, {
    body,
    timeout,
  })
  if (error) {
    let message = error.message
    try {
      message = (await error.context.json()).error || message
    } catch {
      /* no JSON response */
    }
    throw new Error(message)
  }
  if (data?.error) throw new Error(data.error)
  return data
}
export const mediaUrl = async (bucket, path) => {
  if (!path) return ''
  if (/^https?:/.test(path)) return path
  if (bucket === 'project-covers')
    return (
      await result(supabase.storage.from(bucket).createSignedUrl(path, 3600))
    ).signedUrl
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}
export const upload = async (bucket, file, parent) => {
  const max = bucket === 'avatars' ? 2 : 5
  if (
    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
    file.size > max * 1024 * 1024
  )
    throw new Error(`Use a JPEG, PNG or WebP image under ${max} MB.`)
  const extension = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }[file.type]
  const path = `${parent || (await viewerId())}/${crypto.randomUUID()}.${extension}`
  await result(
    supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type, upsert: false }),
  )
  return path
}
