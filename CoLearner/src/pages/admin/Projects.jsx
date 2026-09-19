import React, { useState } from 'react'
import { Eye, EyeOff, Search, Trash2 } from 'lucide-react'
import {
  Badge,
  Button,
  EmptyState,
  Input,
  Select,
  Skeleton,
  useToast,
} from '../../components/ui'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  ConfirmModal,
  ListError,
  Pager,
  TableShell,
  THead,
  useAdminList,
  useDebounced,
} from '../../components/admin/AdminParts.jsx'
import { admin } from '../../services/api.js'
import { PROJECT_STATUS_OPTIONS } from '../../lib/projectStatus.js'

export default function AdminProjects() {
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [visibility, setVisibility] = useState('')
  const [page, setPage] = useState(1)
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(null)
  const q = useDebounced(query)
  const list = useAdminList(admin.adminListProjects, { q, status, visibility, page })
  const { data } = list

  const change = async (project, changes, message) => {
    setBusy(project.slug)
    try {
      await admin.adminUpdateProject(project.slug, changes)
      toast.success(message)
    } catch (error) {
      toast.error(error?.fields?.status?.[0] || error?.message || 'Could not update the project')
    } finally {
      setBusy(null)
      list.reload()
    }
  }
  const filter = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
  }

  return (
    <div>
      <PageHeader title="Projects" subtitle="Review project work, hide anything that should not be listed, and keep the Build space useful." />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <Input
          leftIcon={Search}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(1)
          }}
          placeholder="Search title or owner..."
          aria-label="Search projects"
        />
        <Select value={status} onChange={filter(setStatus)} aria-label="Filter by status" options={[{ value: '', label: 'All statuses' }, ...PROJECT_STATUS_OPTIONS]} className="sm:w-44" />
        <Select
          value={visibility}
          onChange={filter(setVisibility)}
          aria-label="Filter by visibility"
          options={[{ value: '', label: 'Any visibility' }, { value: 'public', label: 'Listed' }, { value: 'hidden', label: 'Hidden' }]}
          className="sm:w-44"
        />
      </div>
      {list.status === 'error' && <ListError onRetry={list.reload} />}
      {list.status === 'loading' ? (
        <div className="space-y-2">{[1, 2, 3, 4].map((n) => <Skeleton key={n} height="56px" />)}</div>
      ) : data?.items.length ? (
        <>
          <TableShell>
            <THead columns={[['Project'], ['Owner'], ['Status'], ['Visibility'], ['Actions', 'right']]} />
            <tbody>
              {data.items.map((project) => (
                <tr key={project.id} data-project={project.slug} className="border-t border-c-border">
                  <td className="px-4 py-4">
                    {project.isPublic ? (
                      <Link to={`/projects/${project.slug}`} className="font-semibold text-c-text hover:text-c-blue">
                        {project.title}
                      </Link>
                    ) : (
                      <span className="font-semibold text-c-text">{project.title}</span>
                    )}
                    <p className="mt-1 text-xs text-c-text-muted">
                      {project.category} · {project.memberCount} {project.memberCount === 1 ? 'member' : 'members'}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-c-text-muted">{project.owner.fullName}</td>
                  <td className="px-4 py-4">
                    <Select
                      value={project.status}
                      aria-label={`Status for ${project.title}`}
                      disabled={busy === project.slug}
                      onChange={(event) => change(project, { status: event.target.value }, `${project.title} is now ${event.target.value}`)}
                      options={PROJECT_STATUS_OPTIONS}
                      className="h-8 min-w-32"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={project.isPublic ? 'success' : 'warning'}>{project.isPublic ? 'Listed' : 'Hidden'}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={project.isPublic ? EyeOff : Eye}
                        disabled={busy === project.slug}
                        onClick={() =>
                          change(
                            project,
                            { isPublic: !project.isPublic },
                            project.isPublic ? `${project.title} is hidden from everyone but its team` : `${project.title} is listed again`,
                          )
                        }
                      >
                        {project.isPublic ? 'Hide' : 'Show'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Trash2}
                        aria-label={`Delete ${project.title}`}
                        onClick={() =>
                          setConfirm({
                            title: `Delete “${project.title}”?`,
                            description: 'The project, its tasks, milestones and updates are deleted for everyone on the team. This cannot be undone. To keep it, hide it instead.',
                            confirmLabel: 'Delete project',
                            danger: true,
                            onConfirm: async () => {
                              await admin.adminDeleteProject(project.slug)
                              toast.success('Project deleted')
                              list.reload()
                            },
                          })
                        }
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          <Pager data={data} onPage={setPage} />
        </>
      ) : (
        <EmptyState title="No projects found" description="Try another search or filter." />
      )}
      <ConfirmModal request={confirm} onClose={() => setConfirm(null)} />
    </div>
  )
}
