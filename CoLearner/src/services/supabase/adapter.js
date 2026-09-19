// Internal resource adapter. These paths are dispatch keys, never Django HTTP requests.
// Existing page contracts and normalizers are kept while Supabase owns auth/data/storage.
import {
  supabase,
  result,
  action,
  mediaUrl,
  viewerId,
  rows,
  one,
  insert,
  update,
  remove,
  slug,
  upload,
  edge,
} from './client'
import {
  profile,
  me,
  book,
  task,
  project,
  thread,
  comment,
  page,
  filterText,
  newest,
  dashboardData,
  profileList,
  bookList,
  projectList,
  threadList,
} from './read-models'
const fields = (body, allowed) =>
  Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))
const profileFields = [
  'username',
  'full_name',
  'avatar',
  'bio',
  'headline',
  'role',
  'location',
  'github',
  'linkedin',
  'website',
  'availability',
  'interests',
]
const projectFields = [
  'title',
  'summary',
  'description',
  'category',
  'tech_stack',
  'looking_for_roles',
  'cover',
  'status',
  'max_members',
  'is_public',
]
const bookFields = [
  'title',
  'author',
  'description',
  'category',
  'difficulty',
  'tags',
  'is_featured',
  'cover',
]
const requireStaff = async () => {
  const p = await me()
  if (!p.is_staff || !p.is_active) throw new Error('Staff access required.')
  return p
}
const rawBody = (body) =>
  body instanceof FormData ? Object.fromEntries(body.entries()) : body || {}
const authResponse = async (data) => ({
  user: await me(),
  access: data.session?.access_token,
  refresh: data.session?.refresh_token,
})
async function dispatch(method, path, body = {}, params = {}) {
  body = rawBody(body)
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent),
    [resource, id, sub, subid] = parts,
    uid = await viewerId()
  if (resource === 'auth') {
    if (id === 'login') {
      let { data, error } = await supabase.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      })
      if (error) {
        if (error.code !== 'invalid_credentials') throw error
        data = await edge('account', {
          action: 'legacy-login',
          email: body.email,
          password: body.password,
        })
        await result(supabase.auth.setSession(data.session))
      }
      await action('touch')
      return authResponse(data)
    }
    if (id === 'register') {
      const data = await result(
        supabase.auth.signUp({
          email: body.email,
          password: body.password,
          options: {
            data: {
              username: body.username,
              full_name: body.full_name,
              terms_accepted: body.terms_accepted === true,
            },
            emailRedirectTo: `${location.origin}/auth/callback`,
          },
        }),
      )
      if (!data.session) return { confirmation_required: true }
      return authResponse(data)
    }
    if (id === 'username-available') {
      return {
        available: !(
          await result(
            supabase
              .from('profiles')
              .select('id')
              .ilike('username', params.username),
          )
        ).length,
      }
    }
    if (id === 'logout') {
      await result(supabase.auth.signOut())
      return {}
    }
    if (id === 'me') {
      if (sub === 'skills') {
        await action('skills', body)
        return me()
      }
      if (method === 'get') return me()
      if (method === 'delete') {
        await edge('account', {
          action: 'delete-self',
          password: body.password,
        })
        await supabase.auth.signOut({ scope: 'local' })
        return {}
      }
      if (body.avatar instanceof File)
        body.avatar = await upload('avatars', body.avatar)
      if (typeof body.interests === 'string') {
        try {
          body.interests = JSON.parse(body.interests)
        } catch {
          body.interests = body.interests.split(',').filter(Boolean)
        }
      }
      await update('profiles', uid, fields(body, profileFields))
      return me()
    }
    if (id === 'onboarding') {
      if (body.skills) await action('skills', { skills: body.skills })
      await update('profiles', uid, fields(body, profileFields))
      await action('onboarding')
      return { user: await me() }
    }
    if (id === 'password') {
      if (sub === 'forgot') {
        await result(
          supabase.auth.resetPasswordForEmail(body.email, {
            redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
          }),
        )
        return {}
      }
      if (sub === 'reset') {
        await result(supabase.auth.updateUser({ password: body.password }))
        await supabase.auth.signOut()
        return {}
      }
      if (sub === 'change') {
        await result(
          supabase.auth.signInWithPassword({
            email: (await me()).email,
            password: body.current_password,
          }),
        )
        await result(supabase.auth.updateUser({ password: body.new_password }))
        await result(supabase.auth.signOut({ scope: 'others' }))
        return {}
      }
    }
  }
  if (resource === 'contact') return edge('contact', body)
  if (resource === 'skills') return rows('skills')
  if (resource === 'users') {
    if (sub === 'connect')
      return action('connection', { ...body, username: id })
    if (sub === 'portfolio') {
      const p = await result(
        supabase.rpc('colearn_portfolio', { username: id }),
      )
      p.profile = await profile(p.profile)
      p.books = await Promise.all(
        p.books.map(async (b) => ({
          ...b,
          cover: await mediaUrl('book-covers', b.cover),
        })),
      )
      return p
    }
    if (id && id !== 'suggested')
      return profile(await one('profiles', 'username', id))
    let all = await profileList(
      (await rows('profiles')).filter((p) => p.is_active),
    )
    all = filterText(all, params.search, [
      'username',
      'full_name',
      'headline',
      'bio',
    ])
    for (const k of ['role', 'availability'])
      if (params[k]) all = all.filter((p) => p[k] === params[k])
    if (params.location) all = filterText(all, params.location, ['location'])
    if (params.skills?.length)
      all = all.filter((p) =>
        params.skills.every((s) =>
          p.skills.some((k) => k.slug === s || k.name === s),
        ),
      )
    if (params.ordering === 'xp') all.sort((a, b) => b.xp - a.xp)
    else newest(all)
    if (id === 'suggested' || params.ordering === 'best_match') {
      const self = all.find((p) => p.id === uid) || (await me())
      const score = (p) =>
        p.skills.filter((s) => self.skills.some((k) => k.id === s.id)).length
      all.sort((a, b) => score(b) - score(a) || b.xp - a.xp)
      if (id === 'suggested')
        all = all
          .filter((p) => p.id !== uid && p.connection_status === 'none')
          .slice(0, 4)
    }
    return all
  }
  if (resource === 'books') {
    if (sub === 'progress') return action('progress', { ...body, slug: id })
    if (id) {
      const b = await book(await one('books', 'slug', id))
      b.related = await Promise.all(
        (await rows('books', '*', { category: b.category }))
          .filter((r) => r.id !== b.id)
          .slice(0, 3)
          .map((b) => book(b)),
      )
      return b
    }
    return bookList(newest(await rows('books')))
  }
  if (resource === 'chapters') {
    if (sub === 'bookmark') return action('bookmark', { id })
    if (sub === 'notes') {
      if (method === 'delete') {
        await remove('notes', params.note_id)
        return {}
      }
      return insert('notes', {
        user_id: uid,
        chapter_id: id,
        content: body.content,
      })
    }
    const c = await one('chapters', 'id', id)
    const [b, notes, bookmarks] = await Promise.all([
      book(await one('books', 'id', c.book_id)),
      rows('notes', '*', { chapter_id: id }),
      rows('bookmarks', '*', { chapter_id: id }),
    ])
    return {
      ...c,
      book: b,
      notes,
      bookmarks,
      is_completed: b.chapters.find((x) => x.id === c.id)?.is_completed,
      est_minutes: Math.max(1, Math.ceil(c.content.split(/\s+/).length / 200)),
    }
  }
  if (resource === 'projects' || (resource === 'admin' && id === 'projects')) {
    const admin = resource === 'admin'
    if (admin) await requireStaff()
    const key = admin ? sub : id
    if (key === 'create') {
      const p = await insert('projects', {
        ...fields(body, projectFields),
        owner_id: uid,
        slug: slug(body.title),
      })
      return project(p)
    }
    if (!key) {
      let all = await projectList(newest(await rows('projects')))
      all = filterText(all, params.search || params.q, [
        'title',
        'summary',
        'description',
      ])
      for (const k of ['status', 'category'])
        if (params[k]) all = all.filter((p) => p[k] === params[k])
      if (params.mine)
        all = all.filter((p) => p.viewer.is_member || p.viewer.is_owner)
      if (params.looking)
        all = all.filter(
          (p) => p.spots_left > 0 && ['idea', 'active'].includes(p.status),
        )
      if (params.tech?.length)
        all = all.filter((p) =>
          params.tech.every((t) => p.tech_stack.includes(t)),
        )
      if (params.ordering === 'fewest')
        all.sort((a, b) => a.member_count - b.member_count)
      return admin ? page(all, params) : all
    }
    const p = await one('projects', 'slug', key)
    if (!admin && sub) {
      if (['join', 'invite'].includes(sub))
        return action(sub, { ...body, slug: id })
      if (sub === 'requests')
        return (
          await rows('join_requests', '*,user:profiles(*)', {
            project_id: p.id,
          })
        ).map((r) => ({ ...r, project_slug: p.slug, project_title: p.title }))
      if (sub === 'members')
        return action(method === 'delete' ? 'remove_member' : 'member_role', {
          ...body,
          slug: id,
          user_id: subid,
        })
      if (sub === 'tasks')
        return task(
          await insert('tasks', {
            ...fields(body, [
              'title',
              'description',
              'status',
              'priority',
              'due_date',
              'order',
              'assignee_id',
            ]),
            project_id: p.id,
          }),
        )
      if (sub === 'milestones')
        return insert('milestones', {
          ...fields(body, ['title', 'description', 'status', 'due_date']),
          project_id: p.id,
        })
      if (sub === 'updates') {
        const row = await insert('project_updates', {
          project_id: p.id,
          author_id: uid,
          body: body.body,
        })
        return { ...row, author: await me() }
      }
    }
    if (method === 'delete') {
      await remove('projects', p.id)
      return {}
    }
    if (method === 'patch') {
      if (body.cover instanceof File)
        body.cover = await upload('project-covers', body.cover, p.id)
      return project(
        await update('projects', p.id, fields(body, projectFields)),
      )
    }
    return project(p)
  }
  if (resource === 'requests') return action('respond', { ...body, id })
  if (resource === 'tasks' || resource === 'milestones') {
    if (method === 'delete') {
      await remove(resource, id)
      return {}
    }
    const rewardSource = `${resource === 'tasks' ? 'task' : 'milestone'}:${id}`
    const previousRewards =
      method === 'get'
        ? []
        : await rows('xp_events', '*', { source: rewardSource, user_id: uid })
    const row =
      method === 'get'
        ? await one(resource, 'id', id)
        : await update(
            resource,
            id,
            fields(
              body,
              resource === 'tasks'
                ? [
                    'title',
                    'description',
                    'status',
                    'priority',
                    'due_date',
                    'order',
                    'assignee_id',
                  ]
                : ['title', 'description', 'status', 'due_date'],
            ),
          )
    if (method === 'get') return resource === 'tasks' ? task(row) : row
    const current = await one(resource, 'id', id)
    const rewards = previousRewards.length
      ? []
      : await rows('xp_events', '*', { source: rewardSource, user_id: uid })
    return {
      ...(resource === 'tasks' ? await task(current) : current),
      xp_awarded: rewards[0]?.amount || 0,
    }
  }
  if (resource === 'threads') {
    if (!id && method === 'post') {
      const t = await insert('threads', {
        author_id: uid,
        slug: slug(body.title),
        ...fields(body, ['title', 'body', 'category']),
      })
      await action('thread_tags', { id: t.id, tags: body.tags || [] })
      return thread(t)
    }
    if (id) {
      const t = await one('threads', 'slug', id)
      if (sub === 'comments') {
        const c = await insert('comments', {
          author_id: uid,
          thread_id: t.id,
          body: body.body,
          parent_id: body.parent_id || null,
        })
        return comment({ ...c, author: await me() }, [], uid)
      }
      if (method === 'delete') {
        await remove('threads', t.id)
        return {}
      }
      await action('view_thread', { id: t.id })
      return thread(await one('threads', 'id', t.id))
    }
    let all = await threadList(newest(await rows('threads')))
    all = filterText(all, params.search, ['title', 'body'])
    if (params.category) all = all.filter((t) => t.category === params.category)
    if (params.tag) all = all.filter((t) => t.tags.includes(params.tag))
    if (params.mine) all = all.filter((t) => t.author_id === uid)
    if (params.answered) all = all.filter((t) => t.comment_count > 0)
    if (params.ordering === 'unanswered')
      all = all.filter((t) => !t.comment_count)
    if (params.ordering === 'top')
      all.sort((a, b) => b.vote_score - a.vote_score)
    return all.sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned))
  }
  if (resource === 'comments') {
    if (method === 'delete') {
      await remove('comments', id)
      return {}
    }
    const c = await update('comments', id, { body: body.body })
    return comment(
      { ...c, author: await one('profiles', 'id', c.author_id) },
      await rows('votes'),
      uid,
    )
  }
  if (resource === 'vote' || resource === 'report')
    return action(resource, body)
  if (resource === 'tags') {
    const [tags, links] = await Promise.all([rows('tags'), rows('thread_tags')])
    return tags.map((t) => ({
      ...t,
      count: links.filter((l) => l.tag_id === t.id).length,
    }))
  }
  if (resource === 'me') {
    if (id === 'badges') return result(supabase.rpc('colearn_badges'))
    if (id === 'xp-history')
      return newest(await rows('xp_events')).slice(0, params.limit || 50)
    if (id === 'library')
      return Promise.all(
        (await rows('reading_progress', '*,book:books(*)')).map(async (p) => ({
          ...p,
          book: await book(p.book),
        })),
      )
  }
  if (resource === 'leaderboard')
    return result(
      supabase.rpc('colearn_leaderboard', {
        period: params.period || 'all',
        role_filter: params.role || '',
        row_limit: Number(params.limit) || 50,
      }),
    )
  if (resource === 'notifications') {
    if (id === 'unread-count')
      return {
        unread_count: (await rows('notifications', '*', { is_read: false }))
          .length,
      }
    if (id === 'read-all') {
      await result(
        supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', uid),
      )
      return {}
    }
    if (sub === 'read') {
      await update('notifications', id, { is_read: true })
      return {}
    }
    let all = newest(
      await rows(
        'notifications',
        '*,actor:profiles!notifications_actor_id_fkey(*)',
      ),
    )
    if (params.unread) all = all.filter((n) => !n.is_read)
    return all.slice(0, params.limit || 50).map((n) => ({
      ...n,
      target: n.target_type
        ? {
            type: n.target_type,
            id: n.target_id,
            label: n.target_label,
            slug: n.target_slug,
          }
        : null,
    }))
  }
  if (resource === 'dashboard') return dashboardData()
  if (resource === 'search') {
    const q = params.q || ''
    const data = { books: [], projects: [], people: [], threads: [] }
    const counts = { books: 0, projects: 0, people: 0, threads: 0 }
    if (q.length >= 2) {
      for (const [type, table] of [
        ['books', 'books'],
        ['projects', 'projects'],
        ['people', 'profiles'],
        ['threads', 'threads'],
      ]) {
        if (params.type && params.type !== 'all' && params.type !== type)
          continue
        const list = filterText(await rows(table), q, [
          'title',
          'full_name',
          'username',
          'description',
          'body',
          'headline',
        ])
        counts[type] = list.length
        data[type] = await Promise.all(
          list
            .slice(0, Math.min(Number(params.limit) || 8, 30))
            .map((x) =>
              type === 'books'
                ? book(x)
                : type === 'projects'
                  ? project(x)
                  : type === 'people'
                    ? profile(x)
                    : thread(x),
            ),
        )
      }
    }
    return {
      query: q,
      results: data,
      type_counts: counts,
      total: Object.values(counts).reduce((a, b) => a + b, 0),
    }
  }
  if (resource === 'admin') {
    await requireStaff()
    if (id === 'users')
      return edge('account', {
        action:
          method === 'get'
            ? 'list-users'
            : method === 'post'
              ? 'create-user'
              : method === 'delete'
                ? 'delete-user'
                : 'update-user',
        id: sub,
        ...body,
        params,
      })
    if (id === 'stats') return result(supabase.rpc('colearn_admin_stats'))
    if (id === 'reports') {
      if (method === 'get')
        return page(
          await result(
            supabase.rpc('colearn_reports', {
              status_filter: params.status || '',
            }),
          ),
          params,
        )
      return result(
        supabase.rpc('colearn_moderate', {
          report_id: Number(sub),
          action: body.action,
        }),
      )
    }
    if (id === 'chapters') {
      if (method === 'delete') {
        await remove('chapters', sub)
        return {}
      }
      return update(
        'chapters',
        sub,
        fields(body, ['title', 'chapter_number', 'content']),
      )
    }
    if (id === 'books') {
      if (subid === 'chapters')
        return insert('chapters', {
          ...fields(body, ['title', 'chapter_number', 'content']),
          book_id: sub,
          slug: slug(body.title),
        })
      if (method === 'delete') {
        await remove('books', sub)
        return {}
      }
      if (method === 'get') {
        if (sub) return book(await one('books', 'id', sub))
        let list = filterText(newest(await rows('books')), params.q, [
          'title',
          'author',
        ])
        if (params.category)
          list = list.filter((b) => b.category === params.category)
        return page(await Promise.all(list.map((b) => book(b))), params)
      }
      if (body.cover instanceof File)
        body.cover = await upload('book-covers', body.cover, uid)
      if (body.remove_cover === 'true') body.cover = null
      if (typeof body.tags === 'string')
        body.tags = body.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      if (typeof body.is_featured === 'string')
        body.is_featured = body.is_featured === 'true'
      const data = fields(body, bookFields)
      return book(
        sub
          ? await update('books', sub, data)
          : await insert('books', { ...data, slug: slug(data.title) }),
      )
    }
  }
  throw new Error(`Unsupported application operation: ${method} ${path}`)
}
const api = {}
for (const method of ['get', 'post', 'put', 'patch', 'delete'])
  api[method] = async (path, body, config) => {
    if (['get', 'delete'].includes(method)) {
      config = body
      body = config?.data
    }
    return { data: await dispatch(method, path, body, config?.params || {}) }
  }
export default api
