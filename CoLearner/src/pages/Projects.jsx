import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import {
  Button,
  EmptyState,
  Pagination,
  SearchBar,
  Select,
  Skeleton,
} from '../components/ui'
import { PageHeader } from '../components/layout/PageHeader'
import ProjectCard from '../components/projects/ProjectCard'
import { projects as projectsApi } from '../services/api.js'
import { PROJECT_STATUS_OPTIONS } from '../lib/projectStatus.js'

const PAGE_SIZE = 6
const statusOptions = [
  { value: '', label: 'All statuses' },
  ...PROJECT_STATUS_OPTIONS.map(({ value, label }) => ({ value, label })),
]

function SkeletonGrid() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div
          key={item}
          className="overflow-hidden rounded-brand-lg border border-c-border bg-white"
        >
          <Skeleton className="h-28 rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton width="70%" height="24px" />
            <Skeleton width="100%" height="38px" />
            <Skeleton width="60%" height="16px" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Projects() {
  const [projects, setProjects] = useState(null)
  const [facets, setFacets] = useState({ categories: [], tech: [] })
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [tech, setTech] = useState([])
  const [looking, setLooking] = useState(false)
  const [mine, setMine] = useState(false)
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)

  // Filter options come from the projects that exist, loaded once without filters.
  useEffect(() => {
    let active = true
    projectsApi
      .getProjects()
      .then(({ projects: everything }) => {
        if (!active) return
        setFacets({
          categories: [
            ...new Set(everything.map((project) => project.category)),
          ].sort(),
          tech: [...new Set(everything.flatMap((project) => project.techStack))]
            .sort()
            .slice(0, 12),
        })
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  // The list itself is filtered, searched and ordered by the backend.
  useEffect(() => {
    let active = true
    projectsApi
      .getProjects({
        search: query.trim(),
        category,
        status,
        tech,
        looking,
        mine,
        ordering: sort,
      })
      .then(({ projects: result }) => {
        if (!active) return
        setProjects(result)
        setError('')
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError?.message || 'We could not load projects right now.',
          )
      })
    return () => {
      active = false
    }
  }, [query, category, status, tech, looking, mine, sort])

  const resetPage = useCallback(() => setPage(1), [])
  const handleSearch = useCallback(
    (value) => {
      resetPage()
      setQuery(value)
    },
    [resetPage],
  )
  const changing = (setter) => (value) => {
    resetPage()
    setter(value)
  }
  const clear = () => {
    setQuery('')
    setCategory('')
    setStatus('')
    setTech([])
    setLooking(false)
    setMine(false)
    setSort('newest')
    resetPage()
  }
  const totalPages = Math.max(1, Math.ceil((projects || []).length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visible = (projects || []).slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  if (error && !projects)
    return (
      <EmptyState
        title="Projects unavailable"
        description={error}
        actionLabel="Try again"
        onAction={() => window.location.reload()}
      />
    )
  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Find people to build with, or start something worth finishing."
        actions={
          <Button as={Link} to="/projects/new" icon={Plus}>
            New project
          </Button>
        }
      />
      <div className="mb-8 space-y-4 rounded-brand-lg border border-c-border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
          <SearchBar
            value={query}
            onChange={handleSearch}
            containerClassName="flex-1 lg:min-w-[260px]"
            placeholder="Search projects..."
          />
          <Select
            value={category}
            onChange={(event) => changing(setCategory)(event.target.value)}
            options={[
              { value: '', label: 'All categories' },
              ...facets.categories.map((value) => ({ value, label: value })),
            ]}
            aria-label="Filter by category"
          />
          <Select
            value={status}
            onChange={(event) => changing(setStatus)(event.target.value)}
            options={statusOptions}
            aria-label="Filter by status"
          />
        </div>
        <div className="flex flex-col gap-4 border-t border-c-border pt-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-c-text-muted">
              Tech stack
            </span>
            {facets.tech.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() =>
                  changing(setTech)(
                    tech.includes(item)
                      ? tech.filter((value) => value !== item)
                      : [...tech, item],
                  )
                }
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${tech.includes(item) ? 'border-c-blue bg-c-blue text-white' : 'border-c-border text-c-text-muted hover:border-c-blue hover:text-c-blue'}`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-c-text">
              <input
                type="checkbox"
                checked={mine}
                onChange={(event) => changing(setMine)(event.target.checked)}
                className="h-4 w-4 rounded border-c-border text-c-blue focus:ring-c-blue"
              />
              My projects
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-c-text">
              <input
                type="checkbox"
                checked={looking}
                onChange={(event) => changing(setLooking)(event.target.checked)}
                className="h-4 w-4 rounded border-c-border text-c-blue focus:ring-c-blue"
              />
              Looking for members
            </label>
            <Select
              value={sort}
              onChange={(event) => changing(setSort)(event.target.value)}
              options={[
                { value: 'newest', label: 'Newest' },
                { value: 'active', label: 'Most active' },
                { value: 'fewest', label: 'Fewest spots left' },
              ]}
              aria-label="Sort projects"
            />
          </div>
        </div>
      </div>
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-brand bg-red-50 px-3 py-2 text-sm text-c-danger"
        >
          {error}
        </p>
      )}
      {!projects ? (
        <SkeletonGrid />
      ) : visible.length ? (
        <>
          <p className="mb-5 text-sm text-c-text-muted">
            Showing {visible.length} of {projects.length} projects
          </p>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
            className="mt-8"
          />
        </>
      ) : (
        <EmptyState
          title="No projects match those filters"
          description="Try clearing a filter or start the next project yourself."
          actionLabel="Clear filters"
          onAction={clear}
          secondaryActionLabel="Create project"
          secondaryActionTo="/projects/new"
        />
      )}
    </div>
  )
}
