import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, Link, useNavigate, useParams } from 'react-router-dom'
import {
  CalendarDays,
  Check,
  Edit3,
  GripVertical,
  MessageCircle,
  Plus,
  Save,
  Settings2,
  Trash2,
  UserMinus,
} from 'lucide-react'
import {
  Avatar,
  Badge,
  Button,
  Chip,
  Drawer,
  EmptyState,
  Input,
  Modal,
  RichText,
  Select,
  Skeleton,
  Tabs,
  TabsList,
  TabContent,
  TabTrigger,
  Textarea,
  useToast,
} from '../components/ui'
import { PageHeader } from '../components/layout/PageHeader'
import { formatDate, formatRelative } from '../lib/formatters.js'
import { projects } from '../services/api.js'
import ProjectInvitations from '../components/projects/ProjectInvitations'
import ProjectGalleryEditor from '../components/projects/ProjectGalleryEditor'
import { supabase } from '../services/supabase/client'
import { useInFlight } from '../hooks/useInFlight.js'
import { useAuthStore } from '../store/authStore'
import {
  MILESTONE_STATUS_OPTIONS,
  PROJECT_STATUS_OPTIONS,
} from '../lib/projectStatus.js'

const columns = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'review', label: 'In Review' },
  { id: 'done', label: 'Completed' },
]
const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]
const priorityColors = {
  low: 'bg-c-success-solid',
  medium: 'bg-c-warning',
  high: 'bg-c-danger-solid',
  urgent: 'bg-c-danger-solid ring-2 ring-red-200',
}
const roleOptions = [
  { value: 'member', label: 'Member' },
  { value: 'mentor', label: 'Mentor' },
]
const commaList = (text) => [
  ...new Set(
    text
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  ),
]
const firstError = (error, key) => {
  const value = error?.fields?.[key]
  return Array.isArray(value) ? value[0] : value
}

function WorkspaceSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton width="45%" height="38px" />
      <div className="grid gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <Skeleton key={item} height="280px" />
        ))}
      </div>
    </div>
  )
}

function TaskCard({ task, onOpen, onDragStart }) {
  const overdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== 'done'
  return (
    <button
      type="button"
      draggable
      data-task-id={task.id}
      onDragStart={(event) => onDragStart(event, task.id)}
      onClick={() => onOpen(task)}
      className="w-full rounded-brand border border-c-border bg-c-surface p-4 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-c-text-muted/50" />
        <span className="line-clamp-2 flex-1 text-sm font-semibold text-c-text">
          {task.title}
        </span>
        <span
          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${priorityColors[task.priority] || priorityColors.medium}`}
          aria-label={`${task.priority} priority`}
        />
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 text-xs text-c-text-muted">
        <span className={overdue ? 'font-semibold text-c-danger' : ''}>
          {task.dueDate ? formatDate(task.dueDate, 'MMM d') : 'No due date'}
        </span>
        {task.assignee && (
          <Avatar
            src={task.assignee.avatar}
            name={task.assignee.fullName}
            size="sm"
          />
        )}
      </div>
    </button>
  )
}

function TaskForm({ members, initial = {}, onSubmit, onCancel, onDelete }) {
  const [form, setForm] = useState({
    title: initial.title || '',
    description: initial.description || '',
    assignee: initial.assigneeId || '',
    priority: initial.priority || 'medium',
    dueDate: initial.dueDate?.slice(0, 10) || '',
    status: initial.status || 'todo',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }))
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault()
        if (!form.title.trim()) return
        setSaving(true)
        setError('')
        try {
          await onSubmit({ ...form, title: form.title.trim() })
        } catch (submitError) {
          setError(
            firstError(submitError, 'assignee_id') ||
              firstError(submitError, 'title') ||
              firstError(submitError, 'due_date') ||
              submitError?.message ||
              'We could not save the task.',
          )
          setSaving(false)
        }
      }}
      className="space-y-4"
    >
      <Input
        label="Title"
        value={form.title}
        onChange={(event) => set('title', event.target.value)}
        placeholder="Write the task title"
        maxLength={200}
        required
      />
      <Textarea
        label="Description"
        value={form.description}
        onChange={(event) => set('description', event.target.value)}
        rows={4}
        placeholder="What does done look like?"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Assignee"
          value={form.assignee}
          onChange={(event) => set('assignee', event.target.value)}
          options={[
            { value: '', label: 'Unassigned' },
            ...members.map((member) => ({
              value: member.id,
              label: member.fullName,
            })),
          ]}
        />
        <Select
          label="Priority"
          value={form.priority}
          onChange={(event) => set('priority', event.target.value)}
          options={priorities}
        />
      </div>
      {initial.id && (
        <Select
          label="Status"
          value={form.status}
          onChange={(event) => set('status', event.target.value)}
          options={columns.map(({ id, label }) => ({ value: id, label }))}
        />
      )}
      <Input
        label="Due date"
        type="date"
        value={form.dueDate}
        onChange={(event) => set('dueDate', event.target.value)}
      />
      {error && (
        <p className="text-sm font-medium text-c-danger" role="alert">
          {error}
        </p>
      )}
      <div className="flex items-center justify-between gap-3 border-t border-c-border pt-4">
        {onDelete ? (
          <Button
            type="button"
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={onDelete}
          >
            Delete task
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save task
          </Button>
        </div>
      </div>
    </form>
  )
}

function MilestoneForm({ initial = {}, onSubmit, onCancel }) {
  const [title, setTitle] = useState(initial.title || '')
  const [dueDate, setDueDate] = useState(initial.dueDate?.slice(0, 10) || '')
  const [status, setStatus] = useState(initial.status || 'planned')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault()
        if (!title.trim()) return
        setSaving(true)
        setError('')
        try {
          await onSubmit({ title: title.trim(), dueDate, status })
        } catch (submitError) {
          setError(
            firstError(submitError, 'title') ||
              firstError(submitError, 'due_date') ||
              submitError?.message ||
              'We could not save the milestone.',
          )
          setSaving(false)
        }
      }}
      className="space-y-4"
    >
      <Input
        label="Title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Ship the first pilot"
        maxLength={200}
        required
      />
      <Input
        label="Due date"
        type="date"
        value={dueDate}
        onChange={(event) => setDueDate(event.target.value)}
      />
      {initial.id && (
        <Select
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          options={MILESTONE_STATUS_OPTIONS}
        />
      )}
      {error && (
        <p className="text-sm font-medium text-c-danger" role="alert">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-3 border-t border-c-border pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          Save milestone
        </Button>
      </div>
    </form>
  )
}

export default function ProjectWorkspace() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const inFlight = useInFlight()
  const me = useAuthStore((state) => state.user)
  const [project, setProject] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('board')
  const [taskModal, setTaskModal] = useState(null)
  const [taskDrawer, setTaskDrawer] = useState(null)
  const [milestoneModal, setMilestoneModal] = useState(null)
  const [draggedTask, setDraggedTask] = useState(null)
  const [updateText, setUpdateText] = useState('')
  const [posting, setPosting] = useState(false)
  const [requests, setRequests] = useState([])
  const [confirm, setConfirm] = useState(null) // { title, description, label, run }
  const [confirmBusy, setConfirmBusy] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [settings, setSettings] = useState(null)
  const [settingsError, setSettingsError] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const coverInput = useRef(null)

  const applySettings = (result) =>
    setSettings({
      demoUrl: result.demoUrl || '',
      repositoryUrl: result.repositoryUrl || '',
      title: result.title,
      summary: result.summary,
      description: result.description,
      status: result.status,
      maxMembers: String(result.maxMembers),
      isPublic: result.isPublic,
      techStack: result.techStack.join(', '),
      lookingForRoles: result.lookingForRoles.join(', '),
    })

  // Reload everything the server owns (members, tasks, counts) after a change that can affect it.
  const refresh = useCallback(async () => {
    const { project: result } = await projects.getProject(slug)
    setProject(result)
    if (result.viewer.isOwner) {
      const { requests: inbox } = await projects.getJoinRequests(slug)
      setRequests(inbox)
    }
    return result
  }, [slug])

  useEffect(() => {
    let active = true
    projects
      .getProject(slug)
      .then(async ({ project: result }) => {
        if (!active) return
        setProject(result)
        applySettings(result)
        if (result.viewer.isOwner) {
          const { requests: inbox } = await projects.getJoinRequests(slug)
          if (active) setRequests(inbox)
        }
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError?.message || 'This workspace could not be loaded.',
          )
      })
    return () => {
      active = false
    }
  }, [slug])

  useEffect(() => {
    if (!project?.id) return
    let timer
    const update = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        void refresh().catch(() => {})
      }, 200)
    }
    const channel = supabase
      .channel(`project-requests:${project.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'join_requests',
          filter: `project_id=eq.${project.id}`,
        },
        update,
      )
      .subscribe()
    const poll = setInterval(update, 30000)
    return () => {
      clearTimeout(timer)
      clearInterval(poll)
      void supabase.removeChannel(channel)
    }
  }, [project?.id, refresh])

  if (error)
    return (
      <EmptyState
        title="Workspace unavailable"
        description={error}
        actionLabel="Back to project"
        actionTo={`/projects/${slug}`}
      />
    )
  if (!project) return <WorkspaceSkeleton />
  const { viewer } = project
  if (!viewer.isMember) return <Navigate to={`/projects/${slug}`} replace />
  const isOwner = viewer.isOwner

  const failure = (requestError, fallback) =>
    toast.error(requestError?.message || fallback)

  // ---- tasks
  const replaceTask = (task) =>
    setProject((current) => ({
      ...current,
      tasks: current.tasks.map((item) => (item.id === task.id ? task : item)),
    }))
  const updateTask = async (taskId, changes) => {
    const previous = project.tasks
    setProject((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === taskId ? { ...task, ...changes } : task,
      ),
    }))
    try {
      const { task, xpAwarded } = await projects.updateTask(taskId, changes)
      replaceTask(task)
      // Only the person who was paid is told about XP.
      if (xpAwarded > 0) toast.success(`+${xpAwarded} XP`, 'Task completed')
    } catch (requestError) {
      setProject((current) => ({ ...current, tasks: previous }))
      failure(requestError, 'The task could not be updated')
      throw requestError
    }
  }
  const moveTask = (taskId, status) => {
    const task = project.tasks.find((item) => item.id === taskId)
    if (task && task.status !== status)
      updateTask(taskId, { status }).catch(() => {})
  }
  const addTask = async (data) => {
    const { task } = await projects.createTask(project.slug, {
      ...data,
      status: taskModal.column,
    })
    setProject((current) => ({ ...current, tasks: [...current.tasks, task] }))
    setTaskModal(null)
  }
  const saveTaskEdit = async (data) => {
    await updateTask(taskDrawer.id, data)
    setTaskDrawer(null)
  }
  const askDeleteTask = (task) =>
    setConfirm({
      title: 'Delete this task?',
      description: `"${task.title}" will be removed from the board.`,
      label: 'Delete task',
      run: async () => {
        await projects.deleteTask(task.id)
        setProject((current) => ({
          ...current,
          tasks: current.tasks.filter((item) => item.id !== task.id),
        }))
        setTaskDrawer(null)
      },
    })

  // ---- milestones
  const toggleMilestone = (milestone) =>
    inFlight(`milestone-${milestone.id}`, () => flipMilestone(milestone))
  const flipMilestone = async (milestone) => {
    const next = milestone.status === 'done' ? 'planned' : 'done'
    try {
      const { milestone: saved, xpAwarded } = await projects.updateMilestone(
        milestone.id,
        { status: next },
      )
      setProject((current) => ({
        ...current,
        milestones: current.milestones.map((item) =>
          item.id === saved.id ? saved : item,
        ),
      }))
      if (xpAwarded > 0) toast.success(`+${xpAwarded} XP`, 'Milestone complete')
    } catch (requestError) {
      failure(requestError, 'The milestone could not be updated')
    }
  }
  const saveMilestone = async (data) => {
    if (milestoneModal?.id) {
      const { milestone, xpAwarded } = await projects.updateMilestone(
        milestoneModal.id,
        data,
      )
      setProject((current) => ({
        ...current,
        milestones: current.milestones.map((item) =>
          item.id === milestone.id ? milestone : item,
        ),
      }))
      if (xpAwarded > 0) toast.success(`+${xpAwarded} XP`, 'Milestone complete')
    } else {
      const { milestone } = await projects.createMilestone(project.slug, data)
      setProject((current) => ({
        ...current,
        milestones: [...current.milestones, milestone],
      }))
    }
    setMilestoneModal(null)
  }
  const askDeleteMilestone = (milestone) =>
    setConfirm({
      title: 'Delete this milestone?',
      description: `"${milestone.title}" will be removed.`,
      label: 'Delete milestone',
      run: async () => {
        await projects.deleteMilestone(milestone.id)
        setProject((current) => ({
          ...current,
          milestones: current.milestones.filter(
            (item) => item.id !== milestone.id,
          ),
        }))
      },
    })

  // ---- updates
  const publishUpdate = async (event) => {
    event.preventDefault()
    if (!updateText.trim()) return
    setPosting(true)
    try {
      const { update } = await projects.createUpdate(
        project.slug,
        updateText.trim(),
      )
      setProject((current) => ({
        ...current,
        updates: [update, ...current.updates],
      }))
      setUpdateText('')
    } catch (requestError) {
      failure(requestError, 'Could not post your update')
    } finally {
      setPosting(false)
    }
  }

  // ---- team
  const respond = (request, action) =>
    inFlight(`request-${request.id}`, () => answerRequest(request, action))
  const answerRequest = async (request, action) => {
    try {
      await projects.respondToRequest(request.id, action)
      await refresh()
      toast.success(
        action === 'accept' ? 'Member accepted' : 'Request declined',
      )
    } catch (requestError) {
      failure(requestError, 'Could not answer that request')
    }
  }
  const changeRole = (member, role) =>
    inFlight(`role-${member.id}`, () => saveRole(member, role))
  const saveRole = async (member, role) => {
    try {
      await projects.setMemberRole(project.slug, member.id, role)
      setProject((current) => ({
        ...current,
        members: current.members.map((item) =>
          item.id === member.id ? { ...item, role } : item,
        ),
      }))
    } catch (requestError) {
      failure(requestError, 'Could not change that role')
    }
  }
  const askRemoveMember = (member) =>
    setConfirm({
      title: `Remove ${member.fullName}?`,
      description:
        'Their tasks become unassigned. They can ask to join again later.',
      label: 'Remove member',
      run: async () => {
        await projects.removeMember(project.slug, member.id)
        await refresh()
        toast.success('Member removed')
      },
    })
  const askLeave = () =>
    setConfirm({
      title: 'Leave this project?',
      description:
        'Your tasks become unassigned. You can ask to join again later.',
      label: 'Leave project',
      run: async () => {
        await projects.removeMember(project.slug, me.id)
        navigate('/projects', { replace: true })
      },
    })
  const runConfirm = async () => {
    setConfirmBusy(true)
    try {
      await confirm.run()
      setConfirm(null)
    } catch (requestError) {
      failure(requestError, 'That did not work')
    } finally {
      setConfirmBusy(false)
    }
  }

  // ---- settings (owner)
  const saveSettings = async (event) => {
    event.preventDefault()
    setSettingsSaving(true)
    setSettingsError('')
    try {
      const { project: saved } = await projects.updateProject(project.slug, {
        demoUrl: settings.demoUrl,
        repositoryUrl: settings.repositoryUrl,
        title: settings.title,
        summary: settings.summary,
        description: settings.description,
        status: settings.status,
        maxMembers: Number(settings.maxMembers),
        isPublic: settings.isPublic,
        techStack: commaList(settings.techStack),
        lookingForRoles: commaList(settings.lookingForRoles),
      })
      setProject((current) => ({ ...saved, tasks: current.tasks }))
      applySettings(saved)
      toast.success('Project settings saved')
    } catch (requestError) {
      const fields = requestError?.fields || {}
      const first = Object.values(fields)[0]
      setSettingsError(
        (Array.isArray(first) ? first[0] : first) ||
          requestError?.message ||
          'We could not save your changes.',
      )
    } finally {
      setSettingsSaving(false)
    }
  }
  const uploadCover = async (event) => {
    const input = event.target
    const file = input.files?.[0]
    // Reset so choosing the same file again (after a failed upload) still fires onChange.
    input.value = ''
    if (!file) return
    await inFlight('cover', () => sendCover(file))
  }
  const sendCover = async (file) => {
    try {
      const { project: saved } = await projects.setCover(project.slug, file)
      setProject((current) => ({ ...current, cover: saved.cover }))
      toast.success('Cover updated')
    } catch (requestError) {
      failure(
        requestError,
        firstError(requestError, 'cover') || 'The cover could not be uploaded',
      )
    }
  }
  const deleteProject = async () => {
    if (deleteText !== project.title || deleting) return
    setDeleting(true)
    try {
      await projects.deleteProject(project.slug)
      navigate('/projects', { replace: true })
    } catch (requestError) {
      failure(requestError, 'The project could not be deleted')
      setDeleting(false)
    }
  }

  const pendingRequests = requests.filter(
    (request) => request.status === 'pending',
  )
  const setting = (key) => (event) =>
    setSettings((current) => ({ ...current, [key]: event.target.value }))

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${project.title} workspace`}
        subtitle="Coordinate the work, keep momentum visible, and ship together."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button to={`/projects/${slug}/chat`} icon={MessageCircle}>
              Group chat
            </Button>
            <Button as={Link} to={`/projects/${slug}`} variant="outline">
              View project
            </Button>
          </div>
        }
      />
      <Tabs value={tab} onChange={setTab}>
        <TabsList>
          <TabTrigger value="board">Board</TabTrigger>
          <TabTrigger value="milestones">Milestones</TabTrigger>
          <TabTrigger value="team">Team</TabTrigger>
          <TabTrigger value="updates">Updates</TabTrigger>
          {isOwner && (
            <TabTrigger value="settings" icon={Settings2}>
              Settings
            </TabTrigger>
          )}
        </TabsList>
        <TabContent value="board">
          <div className="grid gap-4 overflow-x-auto pb-3 md:grid-cols-2 xl:grid-cols-4">
            {columns.map((column) => {
              const tasks = project.tasks.filter(
                (task) => task.status === column.id,
              )
              return (
                <section
                  key={column.id}
                  data-column={column.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggedTask) moveTask(draggedTask, column.id)
                    setDraggedTask(null)
                  }}
                  className="min-w-[260px] rounded-brand-lg bg-c-blue-wash/60 p-3"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-c-text">
                      {column.label}
                    </h2>
                    <span className="rounded-full bg-c-surface px-2 py-0.5 text-xs font-semibold text-c-text-muted">
                      {tasks.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onOpen={setTaskDrawer}
                        onDragStart={(event, id) => {
                          setDraggedTask(id)
                          event.dataTransfer.effectAllowed = 'move'
                        }}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setTaskModal({ column: column.id })}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-brand border border-dashed border-c-blue/40 py-3 text-sm font-semibold text-c-blue hover:bg-c-blue-soft"
                  >
                    <Plus className="h-4 w-4" />
                    Add task
                  </button>
                </section>
              )
            })}
          </div>
        </TabContent>
        <TabContent value="milestones">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-c-text">Milestones</h2>
              <p className="mt-1 text-sm text-c-text-muted">
                Turn a big idea into a sequence your team can see.
              </p>
            </div>
            <Button icon={Plus} onClick={() => setMilestoneModal({})}>
              Add milestone
            </Button>
          </div>
          <div className="mt-6 space-y-4">
            {project.milestones.length === 0 && (
              <p className="rounded-brand border border-dashed border-c-border p-6 text-sm text-c-text-muted">
                No milestones yet.
              </p>
            )}
            {project.milestones.map((milestone) => (
              <article
                key={milestone.id}
                data-milestone-id={milestone.id}
                className="flex items-center gap-4 rounded-brand-lg border border-c-border bg-c-surface p-5 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleMilestone(milestone)}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${milestone.status === 'done' ? 'border-c-success bg-c-success-solid text-white' : 'border-c-border text-transparent hover:border-c-blue'}`}
                  aria-label={
                    milestone.status === 'done'
                      ? 'Reopen milestone'
                      : 'Complete milestone'
                  }
                >
                  <Check className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <h3
                    className={`font-semibold ${milestone.status === 'done' ? 'text-c-text-muted line-through' : 'text-c-text'}`}
                  >
                    {milestone.title}
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-c-text-muted">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {milestone.dueDate
                      ? `Due ${formatDate(milestone.dueDate, 'MMM d, yyyy')}`
                      : 'No due date'}
                  </p>
                </div>
                <Badge
                  variant={
                    milestone.status === 'done'
                      ? 'success'
                      : milestone.status === 'in_progress'
                        ? 'blue'
                        : 'gray'
                  }
                  size="sm"
                >
                  {
                    MILESTONE_STATUS_OPTIONS.find(
                      (option) => option.value === milestone.status,
                    )?.label
                  }
                </Badge>
                <button
                  type="button"
                  onClick={() => setMilestoneModal(milestone)}
                  className="rounded-brand p-2 text-c-text-muted hover:bg-c-blue-soft hover:text-c-blue"
                  aria-label="Edit milestone"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => askDeleteMilestone(milestone)}
                    className="rounded-brand p-2 text-c-text-muted hover:bg-c-danger-soft hover:text-c-danger"
                    aria-label="Delete milestone"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </article>
            ))}
          </div>
        </TabContent>
        <TabContent value="team">
          <div className="grid gap-4 md:grid-cols-2">
            {project.members.map((member) => {
              const isProjectOwner = member.id === project.owner.id
              return (
                <article
                  key={member.id}
                  data-member-id={member.id}
                  className="flex items-start gap-4 rounded-brand-lg border border-c-border bg-c-surface p-5 shadow-sm"
                >
                  <Avatar
                    src={member.avatar}
                    name={member.fullName}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          to={`/u/${member.username}`}
                          className="font-bold text-c-text hover:text-c-blue"
                        >
                          {member.fullName}
                        </Link>
                        <p className="mt-1 text-sm text-c-text-muted">
                          {isProjectOwner
                            ? 'Owner'
                            : member.role === 'mentor'
                              ? 'Mentor'
                              : 'Member'}
                          {member.joinedAt
                            ? ` · Joined ${formatDate(member.joinedAt, 'MMM yyyy')}`
                            : ''}
                        </p>
                      </div>
                      {isOwner && !isProjectOwner && (
                        <button
                          type="button"
                          onClick={() => askRemoveMember(member)}
                          className="rounded-brand p-2 text-c-text-muted hover:bg-c-danger-soft hover:text-c-danger"
                          aria-label={`Remove ${member.fullName}`}
                        >
                          <UserMinus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {member.skills.slice(0, 4).map((skill) => (
                        <Chip key={skill}>{skill}</Chip>
                      ))}
                    </div>
                    {isOwner && !isProjectOwner && (
                      <Select
                        className="mt-4"
                        aria-label={`Role for ${member.fullName}`}
                        options={roleOptions}
                        value={member.role}
                        onChange={(event) =>
                          changeRole(member, event.target.value)
                        }
                      />
                    )}
                  </div>
                </article>
              )
            })}
          </div>
          {!isOwner && (
            <div className="mt-6">
              <Button variant="outline" onClick={askLeave}>
                Leave project
              </Button>
            </div>
          )}
          <ProjectInvitations project={project} onChange={refresh} />
          {isOwner && (
            <>
              <section className="mt-8">
                <h2 className="text-xl font-bold text-c-text">Join requests</h2>
                <div className="mt-4 space-y-3">
                  {pendingRequests.length ? (
                    pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        data-request-id={request.id}
                        className="flex flex-col gap-4 rounded-brand-lg border border-c-border bg-c-surface p-5 sm:flex-row sm:items-center"
                      >
                        <Avatar
                          src={request.user.avatar}
                          name={request.user.fullName}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/u/${request.user.username}`}
                            className="font-semibold text-c-text hover:text-c-blue"
                          >
                            {request.user.fullName}
                          </Link>
                          <p className="mt-1 whitespace-pre-line break-words text-sm text-c-text-muted">
                            {request.message || 'No message.'}
                          </p>
                          <p className="mt-1 text-xs text-c-text-muted">
                            {formatRelative(request.createdAt)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => respond(request, 'accept')}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => respond(request, 'decline')}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-brand border border-dashed border-c-border p-6 text-sm text-c-text-muted">
                      No pending join requests.
                    </p>
                  )}
                </div>
              </section>
            </>
          )}
        </TabContent>
        <TabContent value="updates">
          <form
            onSubmit={publishUpdate}
            className="rounded-brand-lg border border-c-border bg-c-surface p-5 shadow-sm"
          >
            <Textarea
              value={updateText}
              onChange={(event) => setUpdateText(event.target.value)}
              rows={4}
              maxLength={5000}
              placeholder="Share a decision, a blocker, or a small win..."
            />
            <div className="mt-3 flex justify-end">
              <Button
                type="submit"
                icon={MessageCircle}
                loading={posting}
                disabled={!updateText.trim()}
              >
                Post update
              </Button>
            </div>
          </form>
          <div className="mt-6 space-y-4">
            {project.updates.length === 0 && (
              <p className="text-sm text-c-text-muted">No updates yet.</p>
            )}
            {project.updates.map((update) => (
              <article
                key={update.id}
                className="flex gap-3 rounded-brand-lg border border-c-border bg-c-surface p-5"
              >
                <Avatar
                  src={update.author.avatar}
                  name={update.author.fullName}
                  size="md"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-c-text">
                      {update.author.fullName}
                    </p>
                    <span className="text-xs text-c-text-muted">
                      {formatRelative(update.createdAt)}
                    </span>
                  </div>
                  <RichText
                    text={update.body}
                    className="mt-2 text-sm leading-6 text-c-text-muted"
                  />
                </div>
              </article>
            ))}
          </div>
        </TabContent>
        {isOwner && settings && (
          <TabContent value="settings">
            <ProjectGalleryEditor project={project} onChange={setProject} />
            <form
              onSubmit={saveSettings}
              className="max-w-2xl space-y-5 rounded-brand-lg border border-c-border bg-c-surface p-6 shadow-sm"
            >
              <h2 className="text-xl font-bold text-c-text">
                Project settings
              </h2>
              <Input
                label="Live demo URL"
                type="url"
                value={settings.demoUrl}
                onChange={setting('demoUrl')}
              />
              <Input
                label="Repository URL"
                type="url"
                value={settings.repositoryUrl}
                onChange={setting('repositoryUrl')}
              />
              <Input
                label="Project name"
                value={settings.title}
                onChange={setting('title')}
                maxLength={200}
              />
              <Input
                label="Short summary"
                value={settings.summary}
                onChange={setting('summary')}
                maxLength={255}
              />
              <Textarea
                label="Description"
                value={settings.description}
                onChange={setting('description')}
                rows={5}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Status"
                  value={settings.status}
                  onChange={setting('status')}
                  options={PROJECT_STATUS_OPTIONS.map(({ value, label }) => ({
                    value,
                    label,
                  }))}
                />
                <Input
                  label="Maximum members"
                  type="number"
                  min="1"
                  max="50"
                  value={settings.maxMembers}
                  onChange={setting('maxMembers')}
                />
              </div>
              <Input
                label="Tech stack"
                hint="Separate with commas."
                value={settings.techStack}
                onChange={setting('techStack')}
              />
              <Input
                label="Roles wanted"
                hint="Separate with commas."
                value={settings.lookingForRoles}
                onChange={setting('lookingForRoles')}
              />
              <label className="flex items-center gap-2 text-sm text-c-text">
                <input
                  type="checkbox"
                  checked={settings.isPublic}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      isPublic: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-c-blue"
                />
                Public project (anyone can view the showcase)
              </label>
              <div>
                <input
                  ref={coverInput}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={uploadCover}
                  aria-label="Project cover"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => coverInput.current?.click()}
                >
                  Change cover image
                </Button>
              </div>
              {settingsError && (
                <p className="text-sm font-medium text-c-danger" role="alert">
                  {settingsError}
                </p>
              )}
              <div className="flex justify-end">
                <Button type="submit" icon={Save} loading={settingsSaving}>
                  Save changes
                </Button>
              </div>
              <div className="border-t border-c-danger/30 pt-5">
                <h3 className="font-bold text-c-danger">Danger zone</h3>
                <p className="mt-1 text-sm text-c-text-muted">
                  Deleting a project removes its workspace and cannot be undone.
                </p>
                <Button
                  type="button"
                  variant="danger"
                  className="mt-4"
                  icon={Trash2}
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete project
                </Button>
              </div>
            </form>
          </TabContent>
        )}
      </Tabs>
      <Drawer
        isOpen={Boolean(taskDrawer)}
        onClose={() => setTaskDrawer(null)}
        title={taskDrawer?.title || 'Task detail'}
        description="Edit task details and keep the board current."
      >
        {taskDrawer && (
          <TaskForm
            members={project.members}
            initial={taskDrawer}
            onSubmit={saveTaskEdit}
            onCancel={() => setTaskDrawer(null)}
            onDelete={isOwner ? () => askDeleteTask(taskDrawer) : undefined}
          />
        )}
      </Drawer>
      <Modal
        isOpen={Boolean(taskModal)}
        onClose={() => setTaskModal(null)}
        title="Add task"
        description="Give the team a clear next action."
      >
        {taskModal && (
          <TaskForm
            members={project.members}
            onSubmit={addTask}
            onCancel={() => setTaskModal(null)}
          />
        )}
      </Modal>
      <Modal
        isOpen={Boolean(milestoneModal)}
        onClose={() => setMilestoneModal(null)}
        title={milestoneModal?.id ? 'Edit milestone' : 'Add milestone'}
      >
        {milestoneModal && (
          <MilestoneForm
            initial={milestoneModal}
            onSubmit={saveMilestone}
            onCancel={() => setMilestoneModal(null)}
          />
        )}
      </Modal>
      <Modal
        isOpen={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={confirm?.title}
        description={confirm?.description}
      >
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirm(null)}>
            Cancel
          </Button>
          <Button variant="danger" loading={confirmBusy} onClick={runConfirm}>
            {confirm?.label}
          </Button>
        </div>
      </Modal>
      <Modal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete project"
        description={`Type “${project.title}” to confirm this permanent action.`}
      >
        <Input
          label="Project name"
          value={deleteText}
          onChange={(event) => setDeleteText(event.target.value)}
        />
        <div className="mt-5 flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setDeleteOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={deleteText !== project.title}
            loading={deleting}
            onClick={deleteProject}
          >
            Delete permanently
          </Button>
        </div>
      </Modal>
    </div>
  )
}
