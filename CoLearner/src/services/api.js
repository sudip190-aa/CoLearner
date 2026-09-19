import api, {
  camelToSnakeKeys,
  clearStoredTokens,
  getStoredTokens,
  setStoredTokens,
  snakeToCamel,
} from './client.js'

const arrayFromPayload = (payload) => {
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload.results)) return payload.results
  if (payload && Array.isArray(payload.items)) return payload.items
  if (payload && Array.isArray(payload.books)) return payload.books
  if (payload && Array.isArray(payload.projects)) return payload.projects
  if (payload && Array.isArray(payload.threads)) return payload.threads
  if (payload && Array.isArray(payload.users)) return payload.users
  if (payload && Array.isArray(payload.badges)) return payload.badges
  return []
}

const normalizeUser = (entry = {}) => {
  const user = snakeToCamel(entry || {})
  const skills = Array.isArray(user.skills) ? user.skills : []
  const badges = Array.isArray(user.badges) ? user.badges : []

  return {
    ...user,
    id: String(user.id ?? user.userId ?? 'unknown'),
    name: user.name || user.fullName || user.username || 'Colearn user',
    fullName: user.fullName || user.name || user.username || 'Colearn user',
    username: user.username || '',
    role: user.role || 'learner',
    avatar: user.avatar || '',
    headline: user.headline || '',
    bio: user.bio || '',
    location: user.location || '',
    availability: user.availability || '',
    links: {
      github: user.github || '',
      linkedin: user.linkedin || '',
      website: user.website || '',
    },
    interests: Array.isArray(user.interests) ? user.interests : [],
    level: Number(user.level ?? 1),
    isStaff: Boolean(user.isStaff),
    joinedAt: user.createdAt || '',
    connectionStatus: user.connectionStatus || 'none',
    mutualSkillsCount: Number(user.mutualSkillsCount ?? 0),
    sharedSkills: Array.isArray(user.sharedSkills) ? user.sharedSkills : [],
    xp: Number(user.xp ?? 0),
    streakDays: Number(user.streakDays ?? user.streak ?? 0),
    skills: skills.map((skill) => {
      if (typeof skill === 'string') {
        return { id: `skill-${skill}`, name: skill, level: 'beginner' }
      }
      return {
        ...skill,
        id: String(skill.id ?? skill.skillId ?? 'skill'),
        name: skill.name || skill.label || 'Skill',
        level: skill.level || 'beginner',
      }
    }),
    badges: badges.map((badge) => ({
      ...badge,
      id: String(badge.id ?? badge.badgeId ?? 'badge'),
      name: badge.name || badge.title || 'Badge',
      slug:
        badge.slug || badge.name?.toLowerCase().replace(/\s+/g, '-') || 'badge',
    })),
  }
}

const normalizeBook = (entry = {}, extras = {}) => {
  const book = snakeToCamel(entry || {})
  const chapterList = Array.isArray(book.chapters) ? book.chapters : []
  const chapters = chapterList.map((chapter, index) => ({
    ...chapter,
    id: chapter.id ?? `${book.slug ?? 'book'}-${index + 1}`,
    order: Number(chapter.chapterNumber ?? chapter.order ?? index + 1),
    title: chapter.title ?? `Chapter ${index + 1}`,
    estMinutes: Number(chapter.estMinutes ?? 12),
    isCompleted: Boolean(chapter.isCompleted),
  }))

  const progressPercent = Number(book.progressPercent ?? book.progress ?? 0)
  // status comes from the API: not_started | started | finished
  const status =
    book.status || (progressPercent > 0 ? 'started' : 'not_started')
  const started = Boolean(extras.started ?? status !== 'not_started')

  return {
    ...book,
    ...extras,
    id: String(book.id ?? 'book'),
    title: book.title || 'Untitled book',
    slug: book.slug || '',
    author: book.author || 'Unknown author',
    description: book.description || '',
    category: book.category || 'general',
    difficulty: book.difficulty || 'beginner',
    cover: book.cover || '',
    tags: Array.isArray(book.tags) ? book.tags : [],
    estMinutes: Number(book.estMinutes ?? 0),
    chapters,
    chapterCount: Number(book.chapterCount ?? chapters.length),
    readersCount: Number(book.readersCount ?? 0),
    createdAt: book.createdAt || '',
    progress: progressPercent,
    progressPercent,
    status,
    started,
    finished: status === 'finished',
    currentChapterId: book.currentChapterId ?? null,
    completedChapterIds: Array.isArray(book.completedChapterIds)
      ? book.completedChapterIds
      : [],
    related: Array.isArray(book.related)
      ? book.related.map((item) => normalizeBook(item))
      : [],
  }
}

const normalizeChapter = (entry = {}) => {
  const chapter = snakeToCamel(entry)
  return {
    ...chapter,
    id: chapter.id,
    slug: chapter.slug,
    title: chapter.title,
    order: Number(chapter.chapterNumber ?? 1),
    content: chapter.content || '',
    estMinutes: Number(chapter.estMinutes ?? 1),
    isCompleted: Boolean(chapter.isCompleted),
    book: chapter.book,
    // one bookmark per chapter (the endpoint toggles it)
    bookmarked:
      Array.isArray(chapter.bookmarks) && chapter.bookmarks.length > 0,
    notes: (chapter.notes || []).map(normalizeNote),
  }
}

const normalizeNote = (note) => ({
  id: note.id,
  text: note.content,
  createdAt: note.createdAt,
})

const normalizeMember = (entry) => {
  if (!entry || typeof entry !== 'object') {
    return {
      id: String(entry),
      username: '',
      fullName: 'Member',
      name: 'Member',
      avatar: '',
      headline: '',
      skills: [],
      role: 'member',
      joinedAt: '',
    }
  }
  const member = snakeToCamel(entry)
  // Detail payloads wrap the person: { id: membershipId, user: {...}, role, joinedAt }
  const person = member.user ? member.user : member
  return {
    ...normalizeAuthor(person),
    membershipId: member.user ? String(member.id) : undefined,
    headline: person.headline || '',
    skills: Array.isArray(person.skills)
      ? person.skills.map((skill) =>
          typeof skill === 'string' ? skill : skill.name,
        )
      : [],
    role: member.role || 'member',
    joinedAt: member.joinedAt || '',
  }
}

const normalizeTask = (entry = {}) => {
  const task = snakeToCamel(entry)
  return {
    id: String(task.id),
    projectId: String(task.project ?? ''),
    title: task.title || '',
    description: task.description || '',
    status: task.status || 'todo',
    priority: task.priority || 'medium',
    dueDate: task.dueDate || '',
    order: Number(task.order ?? 0),
    assignee: task.assignee ? normalizeAuthor(task.assignee) : null,
    assigneeId: task.assignee ? String(task.assignee.id) : '',
    xpPaid: Boolean(task.xpPaid),
  }
}

const normalizeMilestone = (entry = {}) => {
  const milestone = snakeToCamel(entry)
  return {
    id: String(milestone.id),
    title: milestone.title || '',
    description: milestone.description || '',
    dueDate: milestone.dueDate || '',
    // planned | in_progress | done
    status: milestone.status || 'planned',
  }
}

const normalizeProjectUpdate = (entry = {}) => {
  const update = snakeToCamel(entry)
  return {
    id: String(update.id),
    body: update.body || '',
    author: normalizeAuthor(update.author),
    createdAt: update.createdAt || '',
  }
}

const normalizeJoinRequest = (entry = {}) => {
  const request = snakeToCamel(entry)
  return {
    id: String(request.id),
    status: request.status,
    message: request.message || '',
    createdAt: request.createdAt || '',
    user: normalizeAuthor(request.user),
    projectSlug: request.projectSlug || '',
    projectTitle: request.projectTitle || '',
  }
}

// Handles both shapes the API returns: the card/list shape (memberPreview, counts) and the full detail shape
// (members, tasks, milestones, updates, viewer).
const normalizeProject = (entry = {}) => {
  const project = snakeToCamel(entry || {})
  const detailed =
    Array.isArray(project.members) &&
    project.members.some(
      (member) => member && typeof member === 'object' && member.user,
    )
  const source = detailed
    ? project.members
    : Array.isArray(project.memberPreview)
      ? project.memberPreview
      : Array.isArray(project.members)
        ? project.members
        : []
  const members = source.map(normalizeMember)
  const tasks = Array.isArray(project.tasks)
    ? project.tasks.map(normalizeTask)
    : []
  const progress = project.taskProgress || {
    total: tasks.length,
    done: tasks.filter((task) => task.status === 'done').length,
    percent: 0,
  }
  const viewer = project.viewer || {}
  const maxMembers = Number(project.maxMembers ?? 5)

  return {
    ...project,
    id: String(project.id ?? 'project'),
    slug: project.slug || '',
    title: project.title || 'Untitled project',
    summary: project.summary || '',
    description: project.description || '',
    // idea | active | completed | archived
    status: project.status || 'idea',
    category: project.category || 'general',
    cover: project.cover || '',
    techStack: Array.isArray(project.techStack) ? project.techStack : [],
    lookingForRoles: Array.isArray(project.lookingForRoles)
      ? project.lookingForRoles
      : [],
    isPublic: project.isPublic !== false,
    maxMembers,
    memberCount: Number(project.memberCount ?? members.length),
    spotsLeft: Number(
      project.spotsLeft ?? Math.max(0, maxMembers - members.length),
    ),
    owner: normalizeAuthor(project.owner),
    members,
    tasks,
    milestones: Array.isArray(project.milestones)
      ? project.milestones.map(normalizeMilestone)
      : [],
    updates: Array.isArray(project.updates)
      ? project.updates.map(normalizeProjectUpdate)
      : [],
    taskProgress: {
      total: Number(progress.total ?? 0),
      done: Number(progress.done ?? 0),
      percent: Number(progress.percent ?? 0),
    },
    createdAt: project.createdAt || '',
    viewer: {
      isMember: Boolean(viewer.isMember),
      isOwner: Boolean(viewer.isOwner),
      role: viewer.role || null,
      joinRequest: viewer.joinRequest
        ? {
            id: String(viewer.joinRequest.id),
            status: viewer.joinRequest.status,
          }
        : null,
    },
  }
}

// Authors come from the API as { id, username, full_name, avatar }; a deleted author is shown as a placeholder.
const normalizeAuthor = (author) => {
  const value = snakeToCamel(author || {})
  return {
    id: String(value.id ?? 'deleted'),
    username: value.username || '',
    fullName: value.fullName || value.name || value.username || 'Deleted user',
    name: value.fullName || value.name || value.username || 'Deleted user',
    avatar: value.avatar || '',
  }
}

const normalizeComment = (entry = {}) => {
  const comment = snakeToCamel(entry)
  return {
    id: String(comment.id),
    threadId: String(comment.thread ?? ''),
    parentId: comment.parent ? String(comment.parent) : null,
    author: normalizeAuthor(comment.author),
    body: comment.body || '',
    votes: Number(comment.voteScore ?? 0),
    userVote: Number(comment.userVote ?? 0),
    replies: (comment.replies || []).map(normalizeComment),
    createdAt: comment.createdAt || '',
    updatedAt: comment.updatedAt || '',
  }
}

const normalizeThread = (entry = {}) => {
  const thread = snakeToCamel(entry || {})
  const comments = Array.isArray(thread.comments)
    ? thread.comments.map(normalizeComment)
    : []
  return {
    ...thread,
    id: String(thread.id ?? 'thread'),
    slug: thread.slug || '',
    title: thread.title || 'Untitled thread',
    body: thread.body || '',
    category: thread.category || 'community',
    tags: Array.isArray(thread.tags) ? thread.tags : [],
    votes: Number(thread.voteScore ?? thread.votes ?? 0),
    userVote: Number(thread.userVote ?? 0),
    views: Number(thread.views ?? 0),
    pinned: Boolean(thread.isPinned ?? thread.pinned),
    author: normalizeAuthor(thread.author),
    commentCount: Number(thread.commentCount ?? comments.length),
    comments,
    createdAt: thread.createdAt || '',
    updatedAt: thread.updatedAt || '',
  }
}

export const auth = {
  login: async (credentials = {}) => {
    const payload = await api.post('/auth/login/', {
      email: credentials.email,
      password: credentials.password,
    })
    const data = snakeToCamel(payload.data || {})
    if (data.access) {
      setStoredTokens({ access: data.access, refresh: data.refresh })
    }
    return {
      user: normalizeUser(data.user),
      token: data.access,
      refresh: data.refresh,
    }
  },
  signup: async (data = {}) => {
    const payload = await api.post('/auth/register/', {
      email: data.email,
      username: data.username,
      full_name: data.fullName || data.name,
      password: data.password,
      password2: data.password,
      terms_accepted: data.terms === true,
    })
    const result = snakeToCamel(payload.data || {})
    if (result.confirmationRequired) return { confirmationRequired: true }
    if (result.access) {
      setStoredTokens({ access: result.access, refresh: result.refresh })
    }
    return {
      user: normalizeUser(result.user),
      token: result.access,
      refresh: result.refresh,
    }
  },
  checkUsername: async (username) => {
    const payload = await api.get('/auth/username-available/', {
      params: { username },
    })
    return Boolean(payload.data?.available)
  },
  logout: async () => {
    // Tokens are stored as plain strings (not JSON), so read them through the shared helper.
    const { refresh } = getStoredTokens()
    try {
      if (refresh) {
        await api.post('/auth/logout/', { refresh })
      }
    } catch {
      // no-op: backend may be unavailable or token already expired
    }
    clearStoredTokens()
    return { success: true }
  },
  getMe: async () => {
    const payload = await api.get('/auth/me/')
    return { user: normalizeUser(payload.data || payload) }
  },
  // Profile fields go to the API as snake_case; a File avatar switches the request to multipart.
  updateMe: async (data = {}) => {
    const body = camelToSnakeKeys(data)
    let payload
    if (body.avatar instanceof File) {
      const form = new FormData()
      Object.entries(body).forEach(([key, value]) => {
        if (value !== undefined && value !== null) form.append(key, value)
      })
      payload = await api.patch('/auth/me/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    } else {
      delete body.avatar
      payload = await api.patch('/auth/me/', body)
    }
    return { user: normalizeUser(payload.data) }
  },
  // Skills are replaced as a whole: ['Python', { name: 'React', level: 'advanced' }, ...]
  setSkills: async (skills = []) => {
    const payload = await api.put('/auth/me/skills/', { skills })
    return { user: normalizeUser(payload.data) }
  },
  completeOnboarding: async (data = {}) => {
    const payload = await api.post('/auth/onboarding/', camelToSnakeKeys(data))
    return { user: normalizeUser(payload.data?.user) }
  },
  changePassword: async ({ currentPassword, newPassword, confirmPassword }) => {
    const payload = await api.post('/auth/password/change/', {
      current_password: currentPassword,
      new_password: newPassword,
      new_password2: confirmPassword ?? newPassword,
    })
    // Every other device was signed out; keep this one going with the fresh tokens.
    if (payload.data?.access)
      setStoredTokens({
        access: payload.data.access,
        refresh: payload.data.refresh,
      })
    return { success: true }
  },
  deleteAccount: async (password) => {
    await api.delete('/auth/me/', { data: { password } })
    clearStoredTokens()
    return { success: true }
  },
  // No mock fallback here: the user must see a real failure (bad token, throttled, server down).
  forgotPassword: async (email) => {
    await api.post('/auth/password/forgot/', { email })
    return { success: true }
  },
  resetPassword: async (data = {}) => {
    await api.post('/auth/password/reset/', {
      email: data.email,
      token: data.token,
      password: data.password,
      password2: data.confirmPassword ?? data.password,
    })
    return { success: true }
  },
}

export const contact = {
  send: async ({ name, email, subject, message } = {}) => {
    await api.post('/contact/', { name, email, subject, message })
    return { success: true }
  },
}

const skillListItem = (skill) => ({
  id: String(skill.id),
  name: skill.name,
  slug: skill.slug,
  category: skill.category || '',
})

export const users = {
  // Filtering, ordering and skill matching happen on the server:
  // { search, role, availability, location, skills: ['react', ...], ordering: 'newest' | 'xp' | 'best_match' }
  getUsers: async (params = {}) => {
    const { search, role, availability, location, skills, ordering } = params
    const query = { search, role, availability, location, ordering }
    Object.keys(query).forEach((key) => !query[key] && delete query[key])
    if (skills?.length) query.skills = skills
    const payload = await api.get('/users/', {
      params: query,
      paramsSerializer: { indexes: null }, // skills=a&skills=b, as Django expects
    })
    const items = arrayFromPayload(payload.data).map(normalizeUser)
    return { items, total: items.length }
  },
  getSuggested: async () => {
    const payload = await api.get('/users/suggested/')
    return { items: arrayFromPayload(payload.data).map(normalizeUser) }
  },
  getUser: async (username) => {
    const payload = await api.get(`/users/${encodeURIComponent(username)}/`)
    return { user: normalizeUser(payload.data) }
  },
  getPortfolio: async (username) => {
    const payload = await api.get(
      `/users/${encodeURIComponent(username)}/portfolio/`,
    )
    const data = snakeToCamel(payload.data)
    return {
      profile: normalizeUser(payload.data.profile),
      skills: data.skills || [],
      projects: data.projects || [],
      badges: data.badges || [],
      books: data.books || [],
      heatmap: data.heatmap || [],
      stats: data.stats || {},
    }
  },
  // action: 'connect' (send request) | 'accept' (recipient only) | 'cancel' (withdraw, decline or disconnect)
  connect: async (username, action = 'connect') => {
    const payload = await api.post(
      `/users/${encodeURIComponent(username)}/connect/`,
      { action },
    )
    return { connectionStatus: payload.data.connection_status }
  },
  getSkills: async () => {
    const payload = await api.get('/skills/')
    return { skills: arrayFromPayload(payload.data).map(skillListItem) }
  },
}
// Older callers (Dashboard suggestions) use this name.
users.connectUser = (username) => users.connect(username, 'connect')

export const library = {
  getBooks: async () => {
    const payload = await api.get('/books/')
    return {
      books: arrayFromPayload(payload.data).map((book) => normalizeBook(book)),
    }
  },
  getBook: async (slug) => {
    const payload = await api.get(`/books/${encodeURIComponent(slug)}/`)
    return { book: normalizeBook(payload.data) }
  },
}

export const books = {
  getChapter: async (chapterId) => {
    const payload = await api.get(`/chapters/${chapterId}/`)
    return { chapter: normalizeChapter(payload.data) }
  },
  // completed=false just moves the "continue reading" pointer; completed=true finishes the chapter.
  // Book progress, XP, level and badges are all decided by the server.
  saveProgress: async (bookSlug, chapterId, { completed = false } = {}) => {
    const payload = await api.post(
      `/books/${encodeURIComponent(bookSlug)}/progress/`,
      {
        chapter_id: chapterId,
        completed,
      },
    )
    const data = snakeToCamel(payload.data)
    return {
      progress:
        typeof data.progress === 'object'
          ? data.progress
          : {
              progressPercent: Number(data.progress || 0),
              completed: Boolean(data.bookCompleted),
              completedChapterIds: data.completedChapterIds || [],
            },
      chapterCompleted: data.chapterCompleted,
      bookCompleted: data.bookCompleted,
      xpAwarded: data.xpAwarded,
      xp: data.xp,
      level: data.level,
      badgesEarned: data.badgesEarned || [],
    }
  },
  getMyLibrary: async () => {
    const payload = await api.get('/me/library/')
    return {
      items: arrayFromPayload(payload.data).map((entry) =>
        normalizeBook(entry.book),
      ),
    }
  },
  // Toggles: returns { bookmarked } for the new state.
  toggleBookmark: async (chapterId) => {
    const payload = await api.post(`/chapters/${chapterId}/bookmark/`, {})
    return { bookmarked: payload.data.status === 'created' }
  },
  addNote: async (chapterId, text) => {
    const payload = await api.post(`/chapters/${chapterId}/notes/`, {
      content: text,
    })
    return { note: normalizeNote(snakeToCamel(payload.data)) }
  },
  deleteNote: async (chapterId, noteId) => {
    await api.delete(`/chapters/${chapterId}/notes/`, {
      params: { note_id: noteId },
    })
    return { success: true }
  },
}

// Only send the keys the caller provided (PATCH must not overwrite fields with defaults).
const taskBody = (data = {}) => {
  const body = {}
  ;['title', 'description', 'status', 'priority', 'order'].forEach((key) => {
    if (data[key] !== undefined) body[key] = data[key]
  })
  if (data.dueDate !== undefined) body.due_date = data.dueDate || null
  if (data.assignee !== undefined)
    body.assignee_id = data.assignee ? String(data.assignee) : null
  return body
}

const milestoneBody = (data = {}) => {
  const body = {}
  ;['title', 'description', 'status'].forEach((key) => {
    if (data[key] !== undefined) body[key] = data[key]
  })
  if (data.dueDate !== undefined)
    body.due_date = data.dueDate ? String(data.dueDate).slice(0, 10) : null
  return body
}

const projectBody = (data = {}) => {
  const body = camelToSnakeKeys(data)
  delete body.cover
  return body
}

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } }

export const projects = {
  // Filtering and ordering run on the server:
  // { search, status, category, tech: ['React'], looking, mine, ordering: 'newest' | 'active' | 'fewest' }
  getProjects: async (params = {}) => {
    const { search, status, category, tech, looking, mine, ordering } = params
    const query = { search, status, category, ordering }
    if (looking) query.looking = 'true'
    if (mine) query.mine = 'true'
    Object.keys(query).forEach((key) => !query[key] && delete query[key])
    if (tech?.length) query.tech = tech
    const payload = await api.get('/projects/', {
      params: query,
      paramsSerializer: { indexes: null },
    })
    return { projects: arrayFromPayload(payload.data).map(normalizeProject) }
  },
  getProject: async (slug) => {
    const payload = await api.get(`/projects/${encodeURIComponent(slug)}/`)
    return { project: normalizeProject(payload.data) }
  },
  // { title, summary, description, category, techStack, lookingForRoles, maxMembers, status, cover: File }
  createProject: async (data = {}) => {
    const payload = await api.post('/projects/create/', projectBody(data))
    let project = payload.data
    let coverError = ''
    if (data.cover instanceof File) {
      // The project already exists at this point, so a bad cover must not make the caller retry (and duplicate it).
      try {
        const form = new FormData()
        form.append('cover', data.cover)
        project = (
          await api.patch(`/projects/${project.slug}/`, form, multipart)
        ).data
      } catch (error) {
        const detail = error?.fields?.cover
        coverError =
          (Array.isArray(detail) ? detail[0] : detail) ||
          error?.message ||
          'The cover could not be uploaded.'
      }
    }
    return {
      project: normalizeProject(project),
      xpAwarded: Number(payload.data.xp_awarded || 0),
      coverError,
    }
  },
  updateProject: async (slug, data = {}) => {
    const payload = await api.patch(
      `/projects/${encodeURIComponent(slug)}/`,
      projectBody(data),
    )
    return { project: normalizeProject(payload.data) }
  },
  setCover: async (slug, file) => {
    const form = new FormData()
    form.append('cover', file)
    const payload = await api.patch(
      `/projects/${encodeURIComponent(slug)}/`,
      form,
      multipart,
    )
    return { project: normalizeProject(payload.data) }
  },
  deleteProject: async (slug) => {
    await api.delete(`/projects/${encodeURIComponent(slug)}/`)
    return { success: true }
  },

  // ---- team
  // Asking to join after being invited accepts the invitation (joined: true).
  requestJoin: async (slug, message = '') => {
    const payload = await api.post(
      `/projects/${encodeURIComponent(slug)}/join/`,
      { message },
    )
    return {
      request: normalizeJoinRequest(payload.data),
      joined: payload.data.status === 'approved',
    }
  },
  getJoinRequests: async (slug) => {
    const payload = await api.get(
      `/projects/${encodeURIComponent(slug)}/requests/`,
    )
    return {
      requests: arrayFromPayload(payload.data).map(normalizeJoinRequest),
    }
  },
  // Owner answers a request; the invited person answers their invitation. action: 'accept' | 'decline'
  respondToRequest: async (requestId, action) => {
    const payload = await api.post(`/requests/${requestId}/respond/`, {
      status: action === 'accept' ? 'approved' : 'rejected',
    })
    return { request: normalizeJoinRequest(payload.data) }
  },
  invite: async (slug, username) => {
    const payload = await api.post(
      `/projects/${encodeURIComponent(slug)}/invite/`,
      { username },
    )
    return { request: normalizeJoinRequest(payload.data) }
  },
  setMemberRole: async (slug, userId, role) => {
    await api.patch(
      `/projects/${encodeURIComponent(slug)}/members/${userId}/`,
      { role },
    )
    return { success: true }
  },
  // Owner removes someone, or a member removes themself (leaves).
  removeMember: async (slug, userId) => {
    await api.delete(`/projects/${encodeURIComponent(slug)}/members/${userId}/`)
    return { success: true }
  },

  // ---- tasks (the assignee is a user id; '' / null unassigns)
  createTask: async (slug, data = {}) => {
    const payload = await api.post(
      `/projects/${encodeURIComponent(slug)}/tasks/`,
      taskBody(data),
    )
    return { task: normalizeTask(payload.data) }
  },
  updateTask: async (taskId, data = {}) => {
    const payload = await api.patch(`/tasks/${taskId}/`, taskBody(data))
    return {
      task: normalizeTask(payload.data),
      xpAwarded: Number(payload.data.xp_awarded || 0),
    }
  },
  deleteTask: async (taskId) => {
    await api.delete(`/tasks/${taskId}/`)
    return { success: true }
  },

  // ---- milestones (status: planned | in_progress | done)
  createMilestone: async (slug, data = {}) => {
    const payload = await api.post(
      `/projects/${encodeURIComponent(slug)}/milestones/`,
      milestoneBody(data),
    )
    return { milestone: normalizeMilestone(payload.data) }
  },
  updateMilestone: async (milestoneId, data = {}) => {
    const payload = await api.patch(
      `/milestones/${milestoneId}/`,
      milestoneBody(data),
    )
    return {
      milestone: normalizeMilestone(payload.data),
      xpAwarded: Number(payload.data.xp_awarded || 0),
    }
  },
  deleteMilestone: async (milestoneId) => {
    await api.delete(`/milestones/${milestoneId}/`)
    return { success: true }
  },

  // ---- updates
  createUpdate: async (slug, body) => {
    const payload = await api.post(
      `/projects/${encodeURIComponent(slug)}/updates/`,
      { body },
    )
    return { update: normalizeProjectUpdate(payload.data) }
  },
}

export const community = {
  // Filtering, search and ordering happen on the server:
  // { category, tag, search, ordering: 'latest' | 'top' | 'unanswered', mine, answered }
  getThreads: async (params = {}) => {
    const { category, tag, search, ordering, mine, answered } = params
    const query = { category, tag, search, ordering }
    if (mine) query.mine = 'true'
    if (answered) query.answered = 'true'
    Object.keys(query).forEach((key) => !query[key] && delete query[key])
    const payload = await api.get('/threads/', { params: query })
    return { threads: arrayFromPayload(payload.data).map(normalizeThread) }
  },
  getThread: async (slug) => {
    const payload = await api.get(`/threads/${encodeURIComponent(slug)}/`)
    return { thread: normalizeThread(payload.data) }
  },
  createThread: async ({ title, body, category, tags = [] }) => {
    const payload = await api.post('/threads/', {
      title,
      body,
      category: String(category || '').toLowerCase(),
      tags,
    })
    return {
      thread: normalizeThread(payload.data),
      xpAwarded: Number(payload.data.xp_awarded || 0),
    }
  },
  deleteThread: async (slug) => {
    await api.delete(`/threads/${encodeURIComponent(slug)}/`)
    return { success: true }
  },
  // parentId is optional; replying to a reply attaches it to the top-level comment on the server.
  createComment: async (slug, { body, parentId } = {}) => {
    const payload = await api.post(
      `/threads/${encodeURIComponent(slug)}/comments/`,
      {
        body,
        ...(parentId ? { parent_id: parentId } : {}),
      },
    )
    return { comment: normalizeComment(payload.data) }
  },
  updateComment: async (id, body) => {
    const payload = await api.patch(`/comments/${id}/`, { body })
    return { comment: normalizeComment(payload.data) }
  },
  deleteComment: async (id) => {
    await api.delete(`/comments/${id}/`)
    return { success: true }
  },
  // kind: 'thread' | 'comment'; value: 1, -1 or 0. Repeating your vote removes it.
  vote: async (kind, id, value) => {
    const payload = await api.post('/vote/', {
      content_type: kind,
      object_id: id,
      value,
    })
    return { score: payload.data.score, userVote: payload.data.user_vote }
  },
  report: async (kind, id, reason) => {
    const payload = await api.post('/report/', {
      content_type: kind,
      object_id: id,
      reason,
    })
    return { alreadyReported: Boolean(payload.data.already_reported) }
  },
  getTags: async () => {
    const payload = await api.get('/tags/')
    return {
      tags: arrayFromPayload(payload.data).map((tag) => ({
        id: String(tag.id),
        slug: tag.slug,
        name: tag.name,
        count: tag.count,
      })),
    }
  },
}

const normalizeLeaderEntry = (entry = {}) => {
  const item = snakeToCamel(entry)
  const person = item.user || {}
  return {
    rank: Number(item.rank ?? 0),
    xp: Number(item.xp ?? 0),
    isSelf: Boolean(item.self),
    user: {
      ...normalizeAuthor(person),
      level: Number(person.level ?? 1),
      role: person.role || 'learner',
      streakDays: Number(person.streakDays ?? 0),
      badgeCount: Number(person.badgeCount ?? 0),
    },
  }
}

const normalizeBadgeItem = (entry = {}) => {
  const badge = snakeToCamel(entry)
  return {
    id: String(badge.id),
    slug: badge.slug || '',
    name: badge.name || 'Badge',
    description: badge.description || '',
    criteriaKey: badge.criteriaKey || '',
    category: badge.category || 'Other',
    xpReward: Number(badge.xpReward ?? 0),
    icon: badge.icon || 'award',
    earnedAt: badge.earnedAt || '',
    progress: Number(badge.progress ?? 0),
    required: Math.max(Number(badge.required ?? 1), 1),
  }
}

const normalizeServerNotification = (entry = {}) => {
  const item = snakeToCamel(entry)
  const target = item.target
  return {
    id: String(item.id),
    verb: item.verb || '',
    actor: item.actor ? normalizeAuthor(item.actor) : null,
    target: target
      ? {
          type: target.type || '',
          id: String(target.id ?? ''),
          label: target.label || '',
          slug: target.slug || '',
        }
      : null,
    isRead: Boolean(item.isRead),
    createdAt: item.createdAt || '',
  }
}

export const game = {
  // period: 'week' | 'month' | 'all'. The signed-in person always gets their own row (isSelf) with their real rank.
  getLeaderboard: async ({ period = 'all', role = '', limit } = {}) => {
    const params = { period }
    if (role) params.role = role
    if (limit) params.limit = limit
    const payload = await api.get('/leaderboard/', { params })
    return { entries: arrayFromPayload(payload.data).map(normalizeLeaderEntry) }
  },
  // Every badge, split into what the signed-in person earned and what is still locked (with progress).
  getBadges: async () => {
    const payload = await api.get('/me/badges/')
    return {
      earned: (payload.data?.earned || []).map(normalizeBadgeItem),
      locked: (payload.data?.locked || []).map(normalizeBadgeItem),
    }
  },
  getXpHistory: async (limit = 50) => {
    const payload = await api.get('/me/xp-history/', { params: { limit } })
    return {
      events: (payload.data || []).map((event) => ({
        id: String(event.id),
        amount: Number(event.amount ?? 0),
        reason: event.reason || '',
        createdAt: event.created_at || '',
      })),
    }
  },
}

export const notifs = {
  getNotifications: async ({ limit = 50, unread = false } = {}) => {
    const params = { limit }
    if (unread) params.unread = 1
    const payload = await api.get('/notifications/', { params })
    return {
      notifications: arrayFromPayload(payload.data).map(
        normalizeServerNotification,
      ),
    }
  },
  getUnreadCount: async () => {
    const payload = await api.get('/notifications/unread-count/')
    return Number(payload.data?.unread_count ?? 0)
  },
  markRead: async (id) => {
    await api.post(`/notifications/${id}/read/`, {})
    return { success: true }
  },
  markAllRead: async () => {
    await api.post('/notifications/read-all/', {})
    return { success: true }
  },
}

const normalizeDashboardStats = (stats = {}) => {
  const s = snakeToCamel(stats)
  const floor = Number(s.levelFloorXp ?? 0)
  const next = Number(s.nextLevelXp ?? floor + 50)
  return {
    xp: Number(s.xp ?? 0),
    level: Number(s.level ?? 1),
    levelFloorXp: floor,
    nextLevelXp: next,
    // progress inside the current level, 0-100
    levelProgress:
      next > floor
        ? Math.round(((Number(s.xp ?? 0) - floor) / (next - floor)) * 100)
        : 0,
    streakDays: Number(s.streakDays ?? 0),
    activeProjects: Number(s.activeProjects ?? 0),
    booksInProgress: Number(s.booksInProgress ?? 0),
    badgesEarned: Number(s.badgesEarned ?? 0),
  }
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const dashboard = {
  // One call for what is only about the signed-in person, plus the shared lists (projects, people, trending) in
  // parallel. The core call failing is an error; a shared list failing just leaves that section empty.
  getDashboard: async () => {
    const [core, mine, people, hot] = await Promise.allSettled([
      api.get('/dashboard/'),
      projects.getProjects({ mine: true }),
      users.getSuggested(),
      community.getThreads({ ordering: 'top' }),
    ])
    if (core.status === 'rejected') throw core.reason
    const data = snakeToCamel(core.value.data)
    const reading = data.reading
    return {
      stats: normalizeDashboardStats(data.stats),
      tasks: data.tasks || [],
      reading: reading
        ? {
            book: {
              id: String(reading.book.id),
              slug: reading.book.slug,
              title: reading.book.title,
              category: reading.book.category,
              cover: reading.book.cover || '',
            },
            chapter: reading.chapter,
            progress: Number(reading.progress ?? 0),
          }
        : null,
      activity: (data.activity || []).map((event) => ({
        id: String(event.id),
        text: event.text,
        amount: Number(event.amount ?? 0),
        createdAt: event.createdAt,
      })),
      badges: (data.badges || []).map(normalizeBadgeItem),
      weeklyXp: (data.weeklyXp || []).map((day) => ({
        date: day.date,
        day: WEEKDAYS[new Date(`${day.date}T12:00:00`).getDay()],
        xp: Number(day.xp ?? 0),
      })),
      projects: mine.status === 'fulfilled' ? mine.value.projects : [],
      suggestions:
        people.status === 'fulfilled' ? people.value.items.slice(0, 3) : [],
      trending: hot.status === 'fulfilled' ? hot.value.threads.slice(0, 4) : [],
    }
  },
}

export const search = {
  // type: 'all' | 'books' | 'projects' | 'people' | 'threads'. Queries under 2 characters return nothing.
  globalSearch: async (query = '', { type = 'all', limit } = {}) => {
    const params = { q: query, type }
    if (limit) params.limit = limit
    const payload = await api.get('/search/', { params })
    const data = snakeToCamel(payload.data)
    const results = data.results || {}
    return {
      query: data.query || '',
      total: Number(data.total ?? 0),
      counts: {
        books: Number(data.typeCounts?.books ?? 0),
        projects: Number(data.typeCounts?.projects ?? 0),
        people: Number(data.typeCounts?.people ?? 0),
        threads: Number(data.typeCounts?.threads ?? 0),
      },
      books: (results.books || []).map((item) => ({
        ...item,
        id: String(item.id),
        cover: item.cover || '',
      })),
      projects: (results.projects || []).map((item) => ({
        ...item,
        id: String(item.id),
      })),
      people: (results.people || []).map((item) => ({
        ...normalizeAuthor(item),
        headline: item.headline || '',
        role: item.role || 'learner',
        skills: item.skills || [],
      })),
      threads: (results.threads || []).map((item) => ({
        ...item,
        id: String(item.id),
        author: normalizeAuthor(item.author),
      })),
    }
  },
}

// ---------------------------------------------------------------- admin (staff only)
const normalizePage = (payload, mapItem) => {
  const data = snakeToCamel(payload)
  return {
    items: (data.results || []).map(mapItem),
    count: Number(data.count ?? 0),
    page: Number(data.page ?? 1),
    pages: Number(data.pages ?? 1),
    pageSize: Number(data.pageSize ?? 20),
  }
}

const normalizeAdminUser = (entry = {}) => {
  const user = snakeToCamel(entry)
  return {
    id: String(user.id),
    username: user.username || '',
    fullName: user.fullName || user.username || '',
    email: user.email || '',
    avatar: user.avatar || '',
    role: user.role || 'learner',
    isActive: Boolean(user.isActive),
    isStaff: Boolean(user.isStaff),
    xp: Number(user.xp ?? 0),
    level: Number(user.level ?? 1),
    createdAt: user.createdAt || '',
    lastActive: user.lastActive || '',
  }
}

const normalizeAdminBook = (entry = {}) => {
  const book = snakeToCamel(entry)
  return {
    ...book,
    status: book.publicationStatus || 'DRAFT',
    id: String(book.id),
    slug: book.slug || '',
    title: book.title || '',
    author: book.author || '',
    description: book.description || '',
    category: book.category || '',
    difficulty: book.difficulty || 'beginner',
    tags: Array.isArray(book.tags) ? book.tags : [],
    cover: book.cover || '',
    isFeatured: Boolean(book.isFeatured),
    estMinutes: Number(book.estMinutes ?? 0),
    chapterCount: Number(book.chapterCount ?? 0),
    readersCount: Number(book.readersCount ?? 0),
    createdAt: book.createdAt || '',
    chapters: (book.chapters || []).map((chapter) => ({
      ...chapter,
      id: String(chapter.id),
      title: chapter.title || '',
      chapterNumber: Number(chapter.chapterNumber ?? 1),
      content: chapter.content || '',
      estMinutes: Number(chapter.estMinutes ?? 1),
    })),
  }
}

const normalizeAdminProject = (entry = {}) => {
  const project = snakeToCamel(entry)
  return {
    id: String(project.id),
    slug: project.slug || '',
    title: project.title || '',
    category: project.category || '',
    summary: project.summary || '',
    status: project.status || 'idea',
    isPublic: Boolean(project.isPublic),
    owner: normalizeAuthor(project.owner),
    memberCount: Number(project.memberCount ?? 0),
    createdAt: project.createdAt || '',
  }
}

const normalizeAdminReport = (entry = {}) => {
  const report = snakeToCamel(entry)
  const target = report.target || {}
  return {
    id: String(report.id),
    reporter: normalizeAuthor(report.reporter),
    reason: report.reason || '',
    status: report.status || 'open',
    createdAt: report.createdAt || '',
    target: {
      type: target.type || '',
      id: String(target.id ?? ''),
      exists: Boolean(target.exists),
      label: target.label || '',
      slug: target.slug || '',
      username: target.username || '',
      preview: target.preview || '',
      author: target.author || '',
    },
  }
}

const adminQuery = ({ q, page, pageSize, ...rest } = {}) => {
  const params = { ...rest }
  if (q) params.q = q
  if (page) params.page = page
  if (pageSize) params.page_size = pageSize
  Object.keys(params).forEach(
    (key) => (params[key] === '' || params[key] == null) && delete params[key],
  )
  return params
}

const bookBody = (data = {}) => {
  const { cover, removeCover, ...fields } = data
  const body = camelToSnakeKeys(fields)
  if (!(cover instanceof File) && !removeCover) return body
  // A file goes as multipart, so tags are sent as a comma list and flags as strings.
  const form = new FormData()
  Object.entries(body).forEach(([key, value]) => {
    if (value == null) return
    form.append(key, Array.isArray(value) ? value.join(',') : String(value))
  })
  if (cover instanceof File) form.append('cover', cover)
  if (removeCover) form.append('remove_cover', 'true')
  return form
}

export const admin = {
  getAdminStats: async () => {
    const payload = await api.get('/admin/stats/')
    const data = snakeToCamel(payload.data)
    return {
      totals: data.totals || {},
      signups30d: Number(data.signups30d ?? 0),
      signups7d: Number(data.signups7d ?? 0),
      activeProjects: Number(data.activeProjects ?? 0),
      booksAdded30d: Number(data.booksAdded30d ?? 0),
      openReports: Number(data.openReports ?? 0),
      xpAwarded30d: Number(data.xpAwarded30d ?? 0),
      daily: (data.daily || []).map((day) => ({
        date: day.date,
        day: WEEKDAYS[new Date(`${day.date}T12:00:00`).getDay()],
        signups: Number(day.signups ?? 0),
        projects: Number(day.projects ?? 0),
      })),
      signals: data.signals || {},
      topBooks: data.topBooks || [],
    }
  },

  adminListUsers: async (params = {}) =>
    normalizePage(
      (await api.get('/admin/users/', { params: adminQuery(params) })).data,
      normalizeAdminUser,
    ),
  adminCreateUser: async (data = {}) => {
    const payload = await api.post('/admin/users/', camelToSnakeKeys(data))
    return { user: normalizeAdminUser(payload.data) }
  },
  // { role?, isActive? }
  adminUpdateUser: async (id, data = {}) => {
    const payload = await api.patch(
      `/admin/users/${id}/`,
      camelToSnakeKeys(data),
    )
    return { user: normalizeAdminUser(payload.data) }
  },
  adminDeleteUser: async (id) => {
    await api.delete(`/admin/users/${id}/`)
    return { success: true }
  },

  adminListBooks: async (params = {}) =>
    normalizePage(
      (await api.get('/admin/books/', { params: adminQuery(params) })).data,
      normalizeAdminBook,
    ),
  adminGetBook: async (id) => ({
    book: normalizeAdminBook((await api.get(`/admin/books/${id}/`)).data),
  }),
  // id null = create. { title, author, description, category, difficulty, tags[], isFeatured, cover: File, removeCover }
  adminSaveBook: async (id, data = {}) => {
    const body = bookBody(data)
    const config = body instanceof FormData ? multipart : undefined
    const payload = id
      ? await api.patch(`/admin/books/${id}/`, body, config)
      : await api.post('/admin/books/', body, config)
    return { book: normalizeAdminBook(payload.data) }
  },
  adminDeleteBook: async (id) => {
    await api.delete(`/admin/books/${id}/`)
    return { success: true }
  },
  // chapterId null = add a chapter to the book. { title, content, chapterNumber? }
  adminSaveChapter: async (bookId, chapterId, data = {}) => {
    const body = camelToSnakeKeys(data)
    const payload = chapterId
      ? await api.patch(`/admin/chapters/${chapterId}/`, body)
      : await api.post(`/admin/books/${bookId}/chapters/`, body)
    return {
      chapter: normalizeAdminBook({ chapters: [payload.data] }).chapters[0],
    }
  },
  adminDeleteChapter: async (chapterId) => {
    await api.delete(`/admin/chapters/${chapterId}/`)
    return { success: true }
  },

  adminListProjects: async (params = {}) =>
    normalizePage(
      (await api.get('/admin/projects/', { params: adminQuery(params) })).data,
      normalizeAdminProject,
    ),
  // { status?, isPublic? }
  adminUpdateProject: async (slug, data = {}) => {
    const payload = await api.patch(
      `/admin/projects/${encodeURIComponent(slug)}/`,
      camelToSnakeKeys(data),
    )
    return { project: normalizeAdminProject(payload.data) }
  },
  adminDeleteProject: async (slug) => {
    await api.delete(`/admin/projects/${encodeURIComponent(slug)}/`)
    return { success: true }
  },

  // status: 'pending' (open + in review) | 'open' | 'review' | 'resolved' | 'dismissed'
  adminListReports: async (params = {}) =>
    normalizePage(
      (await api.get('/admin/reports/', { params: adminQuery(params) })).data,
      normalizeAdminReport,
    ),
  // action: 'review' | 'resolve' | 'dismiss' | 'reopen' | 'remove_content' | 'deactivate_user'
  adminActOnReport: async (id, action) => {
    const payload = await api.patch(`/admin/reports/${id}/`, { action })
    return { report: normalizeAdminReport(payload.data) }
  },
}

export default {
  auth,
  users,
  books,
  library,
  projects,
  community,
  game,
  notifs,
  dashboard,
  search,
  admin,
}
