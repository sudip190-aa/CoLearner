import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../services/supabase/client'
import { Plus, SlidersHorizontal } from 'lucide-react'
import {
  Button,
  EmptyState,
  Pagination,
  SearchBar,
  Select,
  Skeleton,
} from '../components/ui'
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
          className="overflow-hidden rounded-2xl border border-c-border bg-c-surface"
        >
          <Skeleton className="h-20 rounded-none" />
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
  const userId = useAuthStore((state) => state.user?.id)
  const cache = useQueryClient()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [tech, setTech] = useState([])
  const [looking, setLooking] = useState(false)
  const [mine, setMine] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)

  const feed = useQuery({
    queryKey: [
      'project-feed',
      userId,
      query,
      category,
      status,
      tech,
      looking,
      mine,
      sort,
      page,
    ],
    queryFn: () =>
      projectsApi.getProjects({
        search: query.trim(),
        category,
        status,
        tech,
        looking,
        mine,
        ordering: sort,
        page,
        pageSize: PAGE_SIZE,
      }),
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  })
  const projects = feed.data?.projects
  const total = feed.data?.count || 0
  const facets = feed.data?.facets ||
    cache
      .getQueriesData({ queryKey: ['project-feed', userId] })
      .map(([, data]) => data?.facets)
      .find(Boolean) || { categories: [], tech: [] }
  const error = feed.error?.message || ''
  useEffect(() => {
    let timer
    const refresh = () => {
      clearTimeout(timer)
      timer = setTimeout(
        () => cache.invalidateQueries({ queryKey: ['project-feed', userId] }),
        150,
      )
    }
    const channel = supabase.channel(
      `project-feed:${userId}:${crypto.randomUUID()}`,
    )
    for (const table of ['projects', 'project_members', 'join_requests'])
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        refresh,
      )
    channel.subscribe((state) => {
      if (state === 'SUBSCRIBED') refresh()
    })
    return () => {
      clearTimeout(timer)
      void supabase.removeChannel(channel)
    }
  }, [userId, cache])
  if (feed.data && page > Math.max(1, Math.ceil(total / PAGE_SIZE)))
    setPage(Math.max(1, Math.ceil(total / PAGE_SIZE)))

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
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visible = projects || []

  const tab = mine ? 'mine' : looking ? 'open' : 'all'
  const tabs = [
    { id: 'all', label: 'All projects' },
    { id: 'mine', label: 'My projects' },
    { id: 'open', label: 'Open teams' },
  ]
  const selectTab = (id) => {
    setMine(id === 'mine')
    setLooking(id === 'open')
    resetPage()
  }
  const moveTab = (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const current = tabs.findIndex((item) => item.id === tab)
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? tabs.length - 1
          : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) %
            tabs.length
    selectTab(tabs[next].id)
    document.getElementById(`projects-tab-${tabs[next].id}`)?.focus()
  }
  const filterCount =
    Number(Boolean(category)) + Number(Boolean(status)) + tech.length
  const clearFilters = () => {
    setCategory('')
    setStatus('')
    setTech([])
    resetPage()
  }

  if (error && !projects)
    return (
      <EmptyState
        title="Projects unavailable"
        description={error}
        actionLabel="Try again"
        onAction={() => feed.refetch()}
      />
    )
  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-7 flex flex-wrap items-start justify-between gap-4 sm:mb-9">
        <div>
          <h1 className="inline-flex items-center gap-3 !text-3xl !font-bold !tracking-tight sm:!text-4xl">
            Projects{' '}
            <span
              aria-hidden="true"
              className="mt-2 h-2.5 w-2.5 rounded-full bg-c-yellow"
            />
          </h1>
          <p className="mt-2 text-sm leading-6 text-c-text-muted sm:text-base">
            Find a team or start your own project.
          </p>
        </div>
        <Button
          as={Link}
          to="/projects/new"
          icon={Plus}
          className="!rounded-xl shadow-[0_4px_12px_-4px_rgba(46,120,229,0.4)]"
        >
          New project
        </Button>
      </header>

      <div className="flex items-center gap-3">
        <SearchBar
          value={query}
          onChange={handleSearch}
          aria-label="Search projects"
          placeholder="Search projects..."
          containerClassName="min-w-0 flex-1"
          className="!h-12 !rounded-xl"
        />
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          aria-controls="project-filters"
          aria-label={`Filter projects${filterCount ? `, ${filterCount} active` : ''}`}
          className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue ${filtersOpen || filterCount ? 'border-c-blue bg-c-blue-soft text-c-blue' : 'border-c-border bg-c-surface text-c-text-muted hover:border-c-blue'}`}
        >
          <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
          {filterCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-c-yellow text-[10px] font-bold text-c-on-accent">
              {filterCount}
            </span>
          )}
        </button>
      </div>

      {filtersOpen && (
        <section
          id="project-filters"
          aria-label="Project filters"
          className="mt-4 rounded-xl border border-c-border bg-c-surface p-4 sm:p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Category"
              value={category}
              onChange={(event) => changing(setCategory)(event.target.value)}
              options={[
                { value: '', label: 'All categories' },
                ...facets.categories.map((value) => ({ value, label: value })),
              ]}
            />
            <Select
              label="Status"
              value={status}
              onChange={(event) => changing(setStatus)(event.target.value)}
              options={statusOptions}
            />
          </div>
          {facets.tech.length > 0 && (
            <fieldset className="mt-4">
              <legend className="mb-2 text-xs font-medium text-c-text-muted">
                Tech stack
              </legend>
              <div className="flex flex-wrap gap-2">
                {facets.tech.map((item) => (
                  <button
                    type="button"
                    key={item}
                    aria-pressed={tech.includes(item)}
                    onClick={() =>
                      changing(setTech)(
                        tech.includes(item)
                          ? tech.filter((value) => value !== item)
                          : [...tech, item],
                      )
                    }
                    className={`rounded-lg border px-2.5 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue ${tech.includes(item) ? 'border-c-blue bg-c-blue-soft text-c-blue' : 'border-c-border text-c-text-muted hover:border-c-blue'}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          {filterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 rounded text-xs font-semibold text-c-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue"
            >
              Reset filters
            </button>
          )}
        </section>
      )}

      <div className="mb-5 mt-7 flex flex-col gap-3 border-b border-c-border sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div
          role="tablist"
          aria-label="Project collections"
          onKeyDown={moveTab}
          className="flex min-w-0 gap-4 sm:gap-6"
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              id={`projects-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              aria-controls="project-results"
              tabIndex={tab === item.id ? 0 : -1}
              onClick={() => selectTab(item.id)}
              className={`shrink-0 whitespace-nowrap border-b-2 px-1 pb-4 pt-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-c-blue sm:text-sm ${tab === item.id ? 'border-c-blue text-c-blue' : 'border-transparent text-c-text-muted hover:text-c-text'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="mb-3 w-full shrink-0 sm:w-44">
          <Select
            value={sort}
            onChange={(event) => changing(setSort)(event.target.value)}
            options={[
              { value: 'newest', label: 'Recently added' },
              { value: 'updated', label: 'Recently updated' },
              { value: 'fewest', label: 'Fewest spots left' },
            ]}
            aria-label="Sort projects"
          />
        </div>
      </div>

      <section
        id="project-results"
        role="tabpanel"
        aria-labelledby={`projects-tab-${tab}`}
        tabIndex={0}
        className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue"
      >
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-xl bg-c-danger-soft px-3 py-2 text-sm text-c-danger"
          >
            {error}
          </p>
        )}
        {!projects ? (
          <SkeletonGrid />
        ) : visible.length ? (
          <>
            <div className="mb-4 flex items-center justify-between gap-3 text-xs text-c-text-muted">
              <p role="status">
                {total} {total === 1 ? 'project' : 'projects'}
              </p>
              {(query || filterCount > 0) && (
                <button
                  type="button"
                  onClick={clear}
                  className="rounded font-medium text-c-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue"
                >
                  Clear filters
                </button>
              )}
            </div>
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
            title={
              mine && !query && !filterCount
                ? 'No projects yet'
                : 'No projects found'
            }
            description={
              mine && !query && !filterCount
                ? 'Projects you create or join will appear here.'
                : 'Try a different search or clear your filters.'
            }
            actionLabel="Clear filters"
            onAction={clear}
            secondaryActionLabel="New project"
            secondaryActionTo="/projects/new"
          />
        )}
      </section>
    </div>
  )
}
