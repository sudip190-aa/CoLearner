import { supabase, result, rows, one, viewerId, mediaUrl } from './client'
const personById = (id) =>
  result(supabase.from('profiles').select('*').eq('id', id).maybeSingle())
export const profile = async (p, context) => {
  if (!p) return null
  const [skills, badges, uid] = context
    ? [
        context.skills.filter((s) => s.user_id === p.id),
        context.badges.filter((b) => b.user_id === p.id),
        context.uid,
      ]
    : await Promise.all([
        rows('user_skills', '*,skill:skills(*)', { user_id: p.id }),
        rows('user_badges', '*,badge:badges(*)', { user_id: p.id }),
        viewerId(),
      ])
  let connection_status = 'none'
  const viewerSkills =
    uid && uid !== p.id
      ? context?.skills.filter((s) => s.user_id === uid) ||
        (await rows('user_skills', '*', { user_id: uid }))
      : []
  const shared = skills
    .filter((s) => viewerSkills.some((v) => v.skill_id === s.skill_id))
    .map((s) => s.skill.name)
    .sort()
  if (uid && uid !== p.id) {
    const connections = context?.connections || (await rows('connections'))
    const c = connections.find(
      (c) =>
        (c.from_user_id === uid && c.to_user_id === p.id) ||
        (c.to_user_id === uid && c.from_user_id === p.id),
    )
    if (c)
      connection_status =
        c.status === 'accepted'
          ? 'accepted'
          : c.from_user_id === uid
            ? 'pending_sent'
            : 'pending_received'
  }
  return {
    ...p,
    avatar: await mediaUrl('avatars', p.avatar),
    skills: skills.map((s) => ({
      ...s.skill,
      level: s.level,
      is_verified: s.is_verified,
    })),
    badges: badges.map((b) => ({ ...b.badge, earned_at: b.earned_at })),
    connection_status,
    mutual_skills_count: shared.length,
    shared_skills: shared.slice(0, 5),
  }
}
export const me = async () => {
  const user = (await result(supabase.auth.getUser())).user
  const p = await profile(await one('profiles', 'id', user.id))
  if (!p.is_active) throw new Error('This account is inactive.')
  return { ...p, email: user.email }
}
export const book = async (b, context) => {
  const [chapters, progress] = context
    ? [
        context.chapters.filter((c) => c.book_id === b.id),
        context.progress.filter((p) => p.book_id === b.id),
      ]
    : await Promise.all([
        rows('chapters', '*', { book_id: b.id }),
        rows('reading_progress', '*', { book_id: b.id }),
      ])
  const p = progress[0]
  const counters =
    context?.counters || (await result(supabase.rpc('colearn_book_stats')))
  chapters.sort((a, b) => a.chapter_number - b.chapter_number)
  return {
    ...b,
    publication_status: b.status,
    cover: await mediaUrl('book-covers', b.cover),
    chapters: chapters.map((c) => ({
      ...c,
      is_completed: p?.completed_chapters.includes(c.id),
      est_minutes: Math.max(1, Math.ceil(c.content.split(/\s+/).length / 200)),
    })),
    chapter_count: chapters.length,
    readers_count: counters.find((c) => c.book_id === b.id)?.readers_count || 0,
    progress: p?.progress_percent || 0,
    completed: p?.completed || false,
    status: p?.completed ? 'finished' : p ? 'started' : 'not_started',
    current_chapter_id: p?.chapter_id,
    completed_chapter_ids: p?.completed_chapters || [],
    total_chapters: chapters.length,
  }
}
export const task = async (t) => ({
  ...t,
  project: t.project_id,
  assignee: t.assignee_id ? await personById(t.assignee_id) : null,
  xp_paid: t.xp_awarded,
  xp_awarded: 0,
})
export const project = async (p, context) => {
  const authenticated = Boolean(await viewerId())
  const [members, milestones, updates, tasks, requests, uid, owner] = context
    ? [
        context.members.filter((m) => m.project_id === p.id),
        context.milestones.filter((m) => m.project_id === p.id),
        context.updates.filter((m) => m.project_id === p.id),
        context.tasks.filter((m) => m.project_id === p.id),
        context.requests.filter((m) => m.project_id === p.id),
        context.uid,
        context.people.find((m) => m.id === p.owner_id),
      ]
    : await Promise.all([
        rows('project_members', '*,user:profiles(*)', { project_id: p.id }),
        authenticated ? rows('milestones', '*', { project_id: p.id }) : [],
        authenticated
          ? rows('project_updates', '*,author:profiles(*)', {
              project_id: p.id,
            })
          : [],
        authenticated
          ? rows('tasks', '*,assignee:profiles(*)', { project_id: p.id })
          : [],
        authenticated
          ? rows(
              'join_requests',
              '*,user:profiles!join_requests_user_id_fkey(*)',
              { project_id: p.id },
            )
          : [],
        viewerId(),
        personById(p.owner_id),
      ])
  const member = members.find((m) => m.user_id === uid),
    done = tasks.filter((t) => t.status === 'done').length
  const counters =
    context?.counters ||
    (authenticated ? await result(supabase.rpc('colearn_project_stats')) : [])
  for (const m of members)
    m.user && (m.user.avatar = await mediaUrl('avatars', m.user.avatar))
  return {
    ...p,
    cover: await mediaUrl('project-covers', p.cover),
    gallery_urls: await Promise.all(
      (p.gallery || []).map((path) => mediaUrl('project-covers', path)),
    ),
    owner: { ...owner, avatar: await mediaUrl('avatars', owner?.avatar) },
    members,
    member_count: members.length,
    spots_left: Math.max(0, p.max_members - members.length),
    milestones,
    updates,
    tasks: tasks.map((t) => ({
      ...t,
      project: t.project_id,
      xp_paid: t.xp_awarded,
    })),
    task_progress: counters.find((c) => c.project_id === p.id) || {
      total: tasks.length,
      done,
      percent: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    },
    viewer: {
      is_member: !!member,
      is_owner: p.owner_id === uid,
      role: member?.role,
      join_request: requests.find((r) => r.user_id === uid) || null,
    },
  }
}
export const comment = async (c, votes, uid) => {
  const v = votes.filter((v) => v.comment_id === c.id)
  return {
    ...c,
    thread: c.thread_id,
    parent: c.parent_id,
    author: {
      ...c.author,
      avatar: await mediaUrl('avatars', c.author?.avatar),
    },
    vote_score: c.vote_score ?? v.reduce((sum, v) => sum + v.value, 0),
    user_vote: c.user_vote ?? (v.find((v) => v.user_id === uid)?.value || 0),
    replies: [],
  }
}
export const commentPage = async (
  discussion,
  before = null,
  parent = null,
  focus = null,
) => {
  const response = await result(
    supabase.rpc('colearn_comment_page', {
      discussion,
      before_id: before,
      parent,
      focus,
    }),
  )
  const all = await Promise.all(
    response.results.map((c) => comment(c, [], null)),
  )
  if (parent)
    return {
      comments: all,
      next_cursor: response.next_cursor,
      count: response.count,
    }
  const roots = all.filter((c) => !c.parent_id)
  for (const c of roots)
    c.replies = all.filter((reply) => reply.parent_id === c.id)
  return {
    comments: roots,
    next_cursor: response.next_cursor,
    count: response.count,
  }
}
export const thread = async (t) => {
  const focus =
    typeof location !== 'undefined' && /^#comment-\d+$/.test(location.hash)
      ? Number(location.hash.slice(9))
      : null
  const [discussion, votes, uid, tags, author] = await Promise.all([
    commentPage(t.id, null, null, focus),
    rows('votes', '*', { thread_id: t.id }),
    viewerId(),
    rows('thread_tags', 'tag:tags(*)', { thread_id: t.id }),
    personById(t.author_id),
  ])
  return {
    ...t,
    author: { ...author, avatar: await mediaUrl('avatars', author?.avatar) },
    tags: tags.map((t) => t.tag.slug),
    comments: discussion.comments,
    next_comment_cursor: discussion.next_cursor,
    comment_count: discussion.count,
    vote_score: votes.reduce((sum, v) => sum + v.value, 0),
    user_vote: votes.find((v) => v.user_id === uid)?.value || 0,
  }
}
export const page = (items, params = {}) => {
  const page = Math.max(1, Number(params.page) || 1),
    size = Math.min(100, Math.max(1, Number(params.page_size) || 20))
  return {
    results: items.slice((page - 1) * size, page * size),
    count: items.length,
    page,
    pages: Math.max(1, Math.ceil(items.length / size)),
    page_size: size,
  }
}
export const filterText = (items, q, keys) =>
  !q
    ? items
    : items.filter((item) =>
        keys.some((k) =>
          String(item[k] || '')
            .toLowerCase()
            .includes(q.toLowerCase()),
        ),
      )
export const newest = (items) =>
  items.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
export const dashboardData = async () => {
  const [p, progress, events, badges, members, tasks] = await Promise.all([
    me(),
    rows('reading_progress', '*,book:books(*),chapter:chapters(*)'),
    rows('xp_events'),
    rows('user_badges', '*,badge:badges(*)', { user_id: await viewerId() }),
    rows('project_members', '*,project:projects(*)', {
      user_id: await viewerId(),
    }),
    result(
      supabase
        .from('tasks')
        .select(
          'id,title,status,priority,due_date,project:projects(title,slug)',
        )
        .eq('assignee_id', await viewerId())
        .neq('status', 'done')
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(100),
    ),
  ])
  const resume = progress
    .filter((p) => p.book && !p.completed)
    .sort((a, b) =>
      String(b.last_read_at).localeCompare(String(a.last_read_at)),
    )[0]
  return {
    tasks,
    stats: {
      ...p,
      level_floor_xp: 50 * (p.level - 1) ** 2,
      next_level_xp: 50 * p.level ** 2,
      active_projects: members.filter((m) =>
        ['idea', 'active'].includes(m.project?.status),
      ).length,
      books_in_progress: progress.filter((p) => p.book && !p.completed).length,
      badges_earned: badges.length,
    },
    reading: resume
      ? {
          book: {
            ...resume.book,
            cover: await mediaUrl('book-covers', resume.book.cover),
          },
          chapter: resume.chapter
            ? { ...resume.chapter, number: resume.chapter.chapter_number }
            : null,
          progress: resume.progress_percent,
        }
      : null,
    activity: newest(events)
      .slice(0, 50)
      .map((e) => ({ ...e, text: e.reason.replaceAll('_', ' ') })),
    badges: badges.map((b) => ({ ...b.badge, earned_at: b.earned_at })),
    weekly_xp: Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - 6 + i)
      const date = d.toISOString().slice(0, 10)
      return {
        date,
        xp: events
          .filter((e) => e.created_at.startsWith(date))
          .reduce((s, e) => s + e.amount, 0),
      }
    }),
  }
}

// Batch related reads for collection views instead of one request per card.
export const profileList = async (list) => {
  const uid = await viewerId()
  const [skills, badges, connections] = await Promise.all([
    rows('user_skills', '*,skill:skills(*)'),
    rows('user_badges', '*,badge:badges(*)'),
    uid ? rows('connections') : [],
  ])
  return Promise.all(
    list.map((p) => profile(p, { skills, badges, connections, uid })),
  )
}
export const bookList = async (list) => {
  const [chapters, progress, counters] = await Promise.all([
    rows('chapters'),
    rows('reading_progress'),
    result(supabase.rpc('colearn_book_stats')),
  ])
  return Promise.all(list.map((b) => book(b, { chapters, progress, counters })))
}
export const projectList = async (list) => {
  const [members, milestones, updates, tasks, requests, uid, people, counters] =
    await Promise.all([
      rows('project_members', '*,user:profiles(*)'),
      rows('milestones'),
      rows('project_updates', '*,author:profiles(*)'),
      rows('tasks', '*,assignee:profiles(*)'),
      rows('join_requests', '*,user:profiles!join_requests_user_id_fkey(*)'),
      viewerId(),
      rows('profiles'),
      result(supabase.rpc('colearn_project_stats')),
    ])
  return Promise.all(
    list.map((p) =>
      project(p, {
        members,
        milestones,
        updates,
        tasks,
        requests,
        uid,
        people,
        counters,
      }),
    ),
  )
}
export const threadList = async (list) => {
  const [comments, votes, uid, tags, people] = await Promise.all([
    rows('comments', '*,author:profiles!comments_author_id_fkey(*)'),
    rows('votes'),
    viewerId(),
    rows('thread_tags', 'thread_id,tag:tags(*)'),
    rows('profiles'),
  ])
  return Promise.all(
    list.map((t) => thread(t, { comments, votes, uid, tags, people })),
  )
}
