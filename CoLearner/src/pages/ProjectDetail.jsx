import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  CalendarDays,
  Check,
  Clipboard,
  ExternalLink,
  Share2,
  Users,
} from 'lucide-react'
import {
  Avatar,
  Badge,
  Button,
  Chip,
  EmptyState,
  Modal,
  ProgressBar,
  RichText,
  TabContent,
  Tabs,
  TabsList,
  TabTrigger,
  Textarea,
  useToast,
} from '../components/ui'
import { BookCover } from '../components/books/BookCover'
import { projects } from '../services/api.js'
import { useAuthStore } from '../store/authStore'
import { formatDate, formatRelative } from '../lib/formatters.js'
import {
  isClosedProject,
  projectStatusLabel,
  projectStatusVariant,
} from '../lib/projectStatus.js'

const roleLabels = { owner: 'Owner', mentor: 'Mentor', member: 'Member' }

function Milestones({ milestones }) {
  if (!milestones.length)
    return <p className="mt-3 text-sm text-c-text-muted">No milestones yet.</p>
  return (
    <div className="mt-5 space-y-5">
      {milestones.map((milestone, index) => (
        <div key={milestone.id} className="relative flex gap-3">
          {index < milestones.length - 1 && (
            <span className="absolute left-3 top-7 h-full w-px bg-c-border" />
          )}
          <span
            className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${milestone.status === 'done' ? 'bg-c-success-solid text-white' : milestone.status === 'in_progress' ? 'bg-c-action text-white' : 'bg-c-blue-soft text-c-text-muted'}`}
          >
            {milestone.status === 'done' ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              index + 1
            )}
          </span>
          <div>
            <p className="text-sm font-semibold text-c-text">
              {milestone.title}
            </p>
            {milestone.dueDate && (
              <p className="mt-1 flex items-center gap-1 text-xs text-c-text-muted">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(milestone.dueDate, 'MMM d, yyyy')}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ProjectDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const currentUserId = useAuthStore((state) => state.user?.id)
  const [project, setProject] = useState(null)
  const [error, setError] = useState('')
  const [requestOpen, setRequestOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState('overview')

  const load = useCallback(async () => {
    const { project: result } = await projects.getProject(slug)
    setProject(result)
    return result
  }, [slug])

  useEffect(() => {
    let active = true
    projects
      .getProject(slug)
      .then(({ project: result }) => active && setProject(result))
      .catch((requestError) => {
        if (active)
          setError(
            requestError?.code === 'not_found'
              ? 'This project could not be found.'
              : requestError?.message || 'This project could not be loaded.',
          )
      })
    return () => {
      active = false
    }
  }, [slug])

  if (error)
    return (
      <EmptyState
        title="Project not found"
        description={error}
        actionLabel="Back to projects"
        actionTo="/projects"
      />
    )
  if (!project)
    return (
      <div className="space-y-6">
        <div className="h-52 animate-pulse rounded-brand-lg bg-c-border/75" />
        <div className="h-10 w-2/3 animate-pulse rounded-brand bg-c-border/75" />
        <div className="h-48 animate-pulse rounded-brand-lg bg-c-border/75" />
      </div>
    )

  const { viewer } = project
  const invited = viewer.joinRequest?.status === 'invited'
  const pending = viewer.joinRequest?.status === 'pending'
  const full = project.spotsLeft <= 0
  const closed = isClosedProject(project)

  const run = async (work, success, leavePrivate = false) => {
    if (busy) return
    setBusy(true)
    try {
      await work()
      if (leavePrivate) navigate('/projects', { replace: true })
      else await load()
      if (success) toast.success(...success)
    } catch (requestError) {
      toast.error(requestError?.message || 'That did not work')
    } finally {
      setBusy(false)
    }
  }
  const request = (event) => {
    event.preventDefault()
    run(async () => {
      await projects.requestJoin(project.slug, message.trim())
      setRequestOpen(false)
      setMessage('')
    }, ['Request sent', `${project.owner.fullName} will see it`])
  }
  const answerInvitation = (action) =>
    run(
      () => projects.respondToRequest(viewer.joinRequest.id, action),
      action === 'accept'
        ? ['Welcome aboard', 'You joined the team']
        : ['Invitation declined'],
      action === 'decline' && !project.isPublic,
    )
  const leave = async () => {
    setBusy(true)
    try {
      await projects.removeMember(project.slug, currentUserId)
      navigate('/projects', { replace: true })
    } catch (requestError) {
      toast.error(requestError?.message || 'Could not leave the project')
      setBusy(false)
    }
  }
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Project link copied')
    } catch {
      toast.info('Copy the project URL from your browser')
    }
  }

  const action = viewer.isMember ? (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        as={Link}
        to={`/projects/${project.slug}/workspace`}
        icon={ExternalLink}
      >
        Open workspace
      </Button>
      {!viewer.isOwner && (
        <Button variant="outline" onClick={() => setLeaveOpen(true)}>
          Leave project
        </Button>
      )}
    </div>
  ) : invited ? (
    <div className="flex flex-wrap items-center gap-2">
      <Button loading={busy} onClick={() => answerInvitation('accept')}>
        Accept invitation
      </Button>
      <Button
        variant="outline"
        disabled={busy}
        onClick={() => answerInvitation('decline')}
      >
        Decline
      </Button>
    </div>
  ) : pending ? (
    <Button disabled icon={Check}>
      Request pending
    </Button>
  ) : closed ? (
    <Button disabled>Not recruiting</Button>
  ) : full ? (
    <Button disabled>Team is full</Button>
  ) : (
    <Button
      icon={Users}
      onClick={() =>
        currentUserId
          ? setRequestOpen(true)
          : navigate(`/login?next=/projects/${project.slug}`)
      }
    >
      Request to join
    </Button>
  )

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-brand-lg border border-c-border bg-c-surface shadow-sm">
        <div className="h-48 bg-c-blue-wash sm:h-64">
          <BookCover book={project} className="h-full w-full" />
        </div>
        <div className="p-5 sm:p-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={projectStatusVariant(project.status)}>
                  {projectStatusLabel(project.status)}
                </Badge>
                <span className="text-sm text-c-text-muted">
                  {project.category}
                </span>
                {!project.isPublic && <Badge variant="gray">Private</Badge>}
              </div>
              <h1 className="mt-3 text-3xl font-bold leading-tight text-c-text sm:text-4xl">
                {project.title}
              </h1>
              {project.summary && (
                <p className="mt-2 max-w-2xl text-base text-c-text-muted">
                  {project.summary}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-c-text-muted">
                <Link
                  to={`/u/${project.owner.username}`}
                  className="flex items-center gap-2 hover:text-c-blue"
                >
                  <Avatar
                    src={project.owner.avatar}
                    name={project.owner.fullName}
                    size="sm"
                  />
                  {project.owner.fullName}
                </Link>
                <span>·</span>
                <span>
                  Created {formatDate(project.createdAt, 'MMM d, yyyy')}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-c-action px-4 py-2.5 text-sm font-semibold text-white"
                >
                  View Live Demo <ExternalLink size={15} />
                </a>
              )}
              {project.repositoryUrl && (
                <a
                  href={project.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-c-blue"
                >
                  Repository ?
                </a>
              )}
              {action}
            </div>
          </div>
        </div>
      </section>
      {!!project.galleryUrls?.length && (
        <section
          aria-label="Project gallery"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {project.galleryUrls.map((url, index) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer">
              <img
                src={url}
                alt={`${project.title} screenshot ${index + 1}`}
                loading="lazy"
                className="h-52 w-full rounded-2xl border border-c-border bg-c-surface object-contain"
              />
            </a>
          ))}
        </section>
      )}
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <Tabs value={tab} onChange={setTab}>
            <TabsList>
              <TabTrigger value="overview">Overview</TabTrigger>
              <TabTrigger value="team">
                Team <span className="ml-1 text-xs">{project.memberCount}</span>
              </TabTrigger>
              <TabTrigger value="updates">
                Updates{' '}
                <span className="ml-1 text-xs">{project.updates.length}</span>
              </TabTrigger>
            </TabsList>
            <TabContent value="overview">
              <div className="space-y-8">
                <section>
                  <h2 className="text-xl font-bold text-c-text">
                    About this project
                  </h2>
                  {project.description ? (
                    <RichText
                      text={project.description}
                      className="mt-3 text-base leading-7 text-c-text-muted"
                    />
                  ) : (
                    <p className="mt-3 text-sm text-c-text-muted">
                      No description yet.
                    </p>
                  )}
                </section>
                <section>
                  <h2 className="text-xl font-bold text-c-text">Tech stack</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {project.techStack.length ? (
                      project.techStack.map((tech) => (
                        <Chip key={tech}>{tech}</Chip>
                      ))
                    ) : (
                      <p className="text-sm text-c-text-muted">
                        No technologies listed.
                      </p>
                    )}
                  </div>
                </section>
                <section>
                  <h2 className="text-xl font-bold text-c-text">
                    Roles needed
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {project.lookingForRoles.length ? (
                      project.lookingForRoles.map((wanted) => (
                        <span
                          key={wanted}
                          className="rounded-full bg-c-yellow-soft px-3 py-1.5 text-sm font-medium text-c-text"
                        >
                          {wanted}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-c-text-muted">
                        This project is not actively recruiting right now.
                      </p>
                    )}
                  </div>
                </section>
                <section>
                  <h2 className="text-xl font-bold text-c-text">Milestones</h2>
                  <Milestones milestones={project.milestones} />
                </section>
              </div>
            </TabContent>
            <TabContent value="team">
              <div className="grid gap-4 sm:grid-cols-2">
                {project.members.map((member) => (
                  <Link
                    key={member.id}
                    to={`/u/${member.username}`}
                    className="flex items-center gap-3 rounded-brand border border-c-border bg-c-surface p-4 hover:border-c-blue"
                  >
                    <Avatar
                      src={member.avatar}
                      name={member.fullName}
                      size="lg"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-c-text">
                        {member.fullName}
                      </p>
                      <p className="truncate text-sm text-c-text-muted">
                        {roleLabels[member.role] || member.role}
                        {member.headline ? ` · ${member.headline}` : ''}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {member.skills.slice(0, 2).map((skill) => (
                          <span key={skill} className="text-xs text-c-blue">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </TabContent>
            <TabContent value="updates">
              <div className="space-y-4">
                {project.updates.length ? (
                  project.updates.map((update) => (
                    <article
                      key={update.id}
                      className="flex gap-3 rounded-brand border border-c-border bg-c-surface p-5"
                    >
                      <Avatar
                        src={update.author.avatar}
                        name={update.author.fullName}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-c-text">
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
                  ))
                ) : (
                  <p className="text-sm text-c-text-muted">No updates yet.</p>
                )}
              </div>
            </TabContent>
          </Tabs>
        </div>
        <aside className="space-y-4">
          <section className="rounded-brand-lg border border-c-border bg-c-surface p-5 shadow-sm">
            <h2 className="text-lg font-bold text-c-text">Project progress</h2>
            <ProgressBar
              value={project.taskProgress.done}
              max={Math.max(1, project.taskProgress.total)}
              className="mt-5"
              label={`${project.taskProgress.done} of ${project.taskProgress.total} tasks done`}
              showValue
            />
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-brand bg-c-blue-wash p-3">
                <p className="text-2xl font-bold text-c-text">
                  {
                    project.milestones.filter(
                      (milestone) => milestone.status === 'done',
                    ).length
                  }
                </p>
                <p className="mt-1 text-xs text-c-text-muted">
                  Milestones done
                </p>
              </div>
              <div className="rounded-brand bg-c-blue-wash p-3">
                <p className="text-2xl font-bold text-c-text">
                  {project.spotsLeft}
                </p>
                <p className="mt-1 text-xs text-c-text-muted">
                  Spots remaining
                </p>
              </div>
            </div>
          </section>
          <Button variant="outline" fullWidth icon={Share2} onClick={share}>
            Share project
          </Button>
          {!viewer.isMember && !closed && (
            <div className="rounded-brand-lg border border-c-border bg-c-blue-wash/50 p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-c-text">
                <Clipboard className="h-4 w-4 text-c-blue" />
                Looking for collaborators?
              </p>
              <p className="mt-2 text-sm leading-5 text-c-text-muted">
                Join the project to contribute to the next milestone.
              </p>
            </div>
          )}
        </aside>
      </div>
      <Modal
        isOpen={requestOpen}
        onClose={() => setRequestOpen(false)}
        title="Request to join"
        description={`Tell ${project.owner.fullName} why this project interests you.`}
      >
        <form onSubmit={request}>
          <Textarea
            label="Message"
            optional
            rows={5}
            value={message}
            maxLength={1000}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="I would love to help with..."
          />
          <div className="mt-5 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRequestOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              Send request
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title="Leave this project?"
        description="Your tasks become unassigned. You can ask to join again later."
      >
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setLeaveOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" loading={busy} onClick={leave}>
            Leave project
          </Button>
        </div>
      </Modal>
    </div>
  )
}
