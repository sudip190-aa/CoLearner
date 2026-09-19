import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  BookOpen,
  Cpu,
  FlaskConical,
  FolderCode,
  Layers,
  Users,
} from 'lucide-react'
import { Avatar, AvatarGroup } from '../ui'
import { isClosedProject, projectStatusLabel } from '../../lib/projectStatus'

const categoryIcons = {
  education: BookOpen,
  ai: Cpu,
  research: FlaskConical,
  community: Users,
  collaboration: Layers,
}

export default function ProjectCard({ project }) {
  const open = !isClosedProject(project) && project.spotsLeft > 0
  const category = project.category || 'Project'
  const yellow = project.status === 'idea'
  const CategoryIcon = categoryIcons[category.toLowerCase()] || FolderCode
  const people = project.members.length
    ? project.members.slice(0, 2)
    : [project.owner]

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-c-border bg-c-surface text-left shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:border-c-blue/25 hover:shadow-[0_12px_32px_-16px_rgba(46,120,229,0.3)] focus-within:border-c-blue/40 motion-safe:hover:-translate-y-1">
      <div
        className={`relative flex h-20 items-center justify-between gap-3 overflow-hidden px-5 ${yellow ? 'bg-c-yellow-soft/70' : 'bg-c-blue-wash'}`}
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -right-3 -top-10 h-32 w-32 rounded-full border-[18px] ${yellow ? 'border-c-yellow/15' : 'border-c-blue/5'}`}
        />
        <div className="relative flex min-w-0 items-center gap-2.5">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-c-surface bg-c-surface/90 shadow-sm ${yellow ? 'text-c-text' : 'text-c-blue'}`}
          >
            <CategoryIcon size={20} strokeWidth={1.6} aria-hidden="true" />
          </span>
          <span
            title={category}
            className="min-w-0 line-clamp-2 text-[10px] font-semibold uppercase leading-4 tracking-[0.08em] text-c-text-muted"
          >
            {category}
          </span>
        </div>
        <span className="relative inline-flex shrink-0 items-center gap-1.5 rounded-full border border-c-surface bg-c-surface/85 px-2.5 py-1 text-[10px] font-medium text-c-text">
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${yellow ? 'bg-c-yellow' : project.status === 'active' ? 'bg-c-action' : 'bg-c-text-muted'}`}
          />
          {projectStatusLabel(project.status)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <Link
          to={`/projects/${project.slug}`}
          title={project.title}
          className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue"
        >
          <h2 className="h-12 line-clamp-2 break-words text-xl font-semibold leading-6 tracking-tight text-c-text transition-colors group-hover:text-c-blue">
            {project.title}
          </h2>
        </Link>
        <p className="mt-2 h-10 line-clamp-2 break-words text-sm leading-5 text-c-text-muted">
          {project.summary}
        </p>
        <div className="mb-5 mt-4 flex h-6 min-w-0 items-center gap-1.5">
          {project.techStack.slice(0, 2).map((tech) => (
            <span
              key={tech}
              title={tech}
              className="min-w-0 truncate rounded-md border border-c-border/80 px-2 py-0.5 text-[11px] font-medium text-c-text-muted"
            >
              {tech}
            </span>
          ))}
          {project.techStack.length > 2 && (
            <span
              title={project.techStack.slice(2).join(', ')}
              className="shrink-0 text-[11px] text-c-text-muted"
            >
              +{project.techStack.length - 2}
            </span>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-c-border pt-4 text-xs">
          <span className="inline-flex min-w-0 items-center gap-1.5 text-c-text-muted">
            <AvatarGroup size="sm" max={2}>
              {people.map((person) => (
                <Avatar
                  key={person.id || person.fullName}
                  src={person.avatar}
                  name={person.fullName}
                  size="sm"
                />
              ))}
            </AvatarGroup>
            <span>
              {open
                ? `${project.spotsLeft} ${project.spotsLeft === 1 ? 'spot' : 'spots'} open`
                : `${project.memberCount} ${project.memberCount === 1 ? 'member' : 'members'}`}
            </span>
          </span>
          <Link
            to={`/projects/${project.slug}`}
            aria-label={`View ${project.title}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg py-1 font-semibold text-c-blue hover:text-c-blue-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue"
          >
            View project{' '}
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-c-blue-soft transition-colors group-hover:bg-c-action group-hover:text-white">
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </Link>
        </div>
      </div>
    </article>
  )
}
