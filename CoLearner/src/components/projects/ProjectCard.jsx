import React from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Users } from 'lucide-react'
import { Avatar, AvatarGroup, Badge, Chip, ProgressBar } from '../ui'
import { BookCover } from '../books/BookCover'
import { formatDate } from '../../lib/formatters.js'
import {
  projectStatusLabel,
  projectStatusVariant,
} from '../../lib/projectStatus.js'

export default function ProjectCard({ project }) {
  const { done, total } = project.taskProgress
  return (
    <article className="overflow-hidden rounded-brand-lg border border-c-border bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link to={`/projects/${project.slug}`}>
        <div className="h-28 bg-c-blue-wash">
          <BookCover book={project} className="h-full w-full" />
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="line-clamp-2 text-lg font-bold leading-6 text-c-text">
              {project.title}
            </h2>
            <Badge variant={projectStatusVariant(project.status)} size="sm">
              {projectStatusLabel(project.status)}
            </Badge>
          </div>
          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-c-text-muted">
            {project.summary}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.techStack.slice(0, 3).map((tech) => (
              <Chip key={tech}>{tech}</Chip>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Avatar
                src={project.owner.avatar}
                name={project.owner.fullName}
                size="sm"
              />
              <span className="max-w-24 truncate text-xs font-medium text-c-text-muted">
                {project.owner.fullName}
              </span>
            </div>
            <AvatarGroup size="sm" max={3}>
              {project.members.map((member) => (
                <Avatar
                  key={member.id}
                  src={member.avatar}
                  name={member.fullName}
                />
              ))}
            </AvatarGroup>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-c-text-muted">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {project.memberCount} of {project.maxMembers} spots
            </span>
            <span>{project.spotsLeft} open</span>
          </div>
          <ProgressBar
            value={done}
            max={Math.max(1, total)}
            size="sm"
            className="mt-3"
            label={`${done}/${total} tasks`}
            showValue
          />
          <p className="mt-4 flex items-center gap-1.5 text-xs text-c-text-muted">
            <CalendarDays className="h-3.5 w-3.5" />
            Created {formatDate(project.createdAt, 'MMM d, yyyy')}
          </p>
        </div>
      </Link>
    </article>
  )
}
