import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { SlidersHorizontal, Users, X } from 'lucide-react'
import {
  EmptyState,
  Pagination,
  SearchBar,
  Select,
  Skeleton,
  useToast,
} from '../components/ui'
import { useAuthStore } from '../store/authStore'
import { users } from '../services/api'
import PersonCard from '../components/people/PersonCard.jsx'

const PAGE_SIZE = 6
const roles = [
  { value: '', label: 'All roles' },
  { value: 'learner', label: 'Learner' },
  { value: 'builder', label: 'Builder' },
  { value: 'mentor', label: 'Mentor' },
]
const availability = [
  { value: '', label: 'Everyone' },
  { value: 'open_to_collaboration', label: 'Open to team up' },
  { value: 'mentoring', label: 'Mentoring' },
  { value: 'focused_learning', label: 'Focused learning' },
]
const sortOrdering = { match: 'best_match', xp: 'xp', newest: 'newest' }

function PeopleSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div
          key={item}
          className="rounded-brand-lg border border-c-border bg-white p-5"
        >
          <div className="flex items-center gap-3">
            <Skeleton width="44px" height="44px" className="!rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton width="70%" height="20px" />
              <Skeleton width="40%" height="12px" />
            </div>
          </div>
          <Skeleton width="70%" height="24px" className="mt-4" />
          <Skeleton width="100%" height="40px" className="mt-3" />
          <div className="mt-4 flex gap-2">
            <Skeleton width="64px" height="24px" />
            <Skeleton width="76px" height="24px" />
          </div>
          <Skeleton width="100%" height="40px" className="mt-5" />
        </div>
      ))}
    </div>
  )
}

export default function People() {
  const toast = useToast()
  const me = useAuthStore((state) => state.user?.id)
  const [people, setPeople] = useState(null)
  const [skills, setSkills] = useState([])
  const [locations, setLocations] = useState([])
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [selectedSkills, setSelectedSkills] = useState([])
  const [role, setRole] = useState('')
  const [availabilityValue, setAvailabilityValue] = useState('')
  const [location, setLocation] = useState('')
  const [sort, setSort] = useState('match')
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [busyId, setBusyId] = useState(null)

  // Load the available filter values once.
  useEffect(() => {
    let active = true
    Promise.all([users.getSkills(), users.getUsers()])
      .then(([skillResult, everyone]) => {
        if (!active) return
        setSkills(skillResult.skills.map((skill) => skill.name))
        setLocations(
          [
            ...new Set(
              everyone.items.map((person) => person.location).filter(Boolean),
            ),
          ].sort(),
        )
      })
      .catch(() => {
        // The main list reports loading errors; filters remain optional.
      })
    return () => {
      active = false
    }
  }, [])

  // The list is filtered and ordered by the backend. (SearchBar already debounces the typed text.)
  useEffect(() => {
    let active = true
    users
      .getUsers({
        search: query.trim(),
        skills: selectedSkills,
        role,
        availability: availabilityValue,
        location,
        ordering: sortOrdering[sort],
      })
      .then(({ items }) => {
        if (!active) return
        setPeople(items.filter((person) => person.id !== me))
        setError('')
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError?.message || 'We could not load people.')
        setPeople((current) => current ?? [])
      })
    return () => {
      active = false
    }
  }, [query, selectedSkills, role, availabilityValue, location, sort, me])

  const resetPage = useCallback(() => setPage(1), [])
  const handleSearch = useCallback(
    (value) => {
      resetPage()
      setQuery(value)
    },
    [resetPage],
  )
  const toggleSkill = (skill) => {
    resetPage()
    setSelectedSkills((items) =>
      items.includes(skill)
        ? items.filter((item) => item !== skill)
        : [...items, skill],
    )
  }
  const applyConnection = (username, connectionStatus) => {
    const patch = (list) =>
      list.map((person) =>
        person.username === username ? { ...person, connectionStatus } : person,
      )
    setPeople((list) => patch(list || []))
  }
  const connect = async (person, action) => {
    if (!action) return
    setBusyId(person.id)
    try {
      const result = await users.connect(person.username, action)
      applyConnection(person.username, result.connectionStatus)
      if (action === 'connect')
        toast.success('Request sent', `We let ${person.fullName} know`)
    } catch (requestError) {
      toast.error(requestError?.message || 'Could not update the connection')
    } finally {
      setBusyId(null)
    }
  }

  const visible = useMemo(
    () => (people || []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [people, page],
  )
  const totalPages = Math.ceil((people || []).length / PAGE_SIZE)
  const clearFilters = () => {
    setQuery('')
    setSelectedSkills([])
    setRole('')
    setAvailabilityValue('')
    setLocation('')
    resetPage()
  }
  const filterCount =
    selectedSkills.length +
    Number(Boolean(role)) +
    Number(Boolean(availabilityValue)) +
    Number(Boolean(location))
  const hasFilters = filterCount > 0 || Boolean(query)
  const change = (setter) => (event) => {
    resetPage()
    setter(event.target.value)
  }
  const filterFields = [
    {
      id: 'people-role',
      label: 'Role',
      value: role,
      setter: setRole,
      options: roles,
    },
    {
      id: 'people-location',
      label: 'Location',
      value: location,
      setter: setLocation,
      options: [
        { value: '', label: 'Anywhere' },
        ...locations.map((value) => ({ value, label: value })),
      ],
    },
    {
      id: 'people-availability',
      label: 'Availability',
      value: availabilityValue,
      setter: setAvailabilityValue,
      options: availability,
    },
  ]
  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 sm:mb-8">
        <h1 className="!text-3xl !font-bold !tracking-tight sm:!text-4xl">
          Discover people
        </h1>
      </header>

      <section aria-label="Find people" className="mb-8">
        <div className="flex items-center gap-3 rounded-2xl bg-c-blue-soft/80 px-5 pb-12 pt-5 sm:px-6 sm:pt-6">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-c-blue"
            aria-hidden="true"
          >
            <Users size={20} />
          </span>
          <p className="text-sm font-medium leading-6 text-c-text">
            Find a study partner, teammate, or mentor.
          </p>
        </div>
        <div className="relative mx-3 -mt-7 grid grid-cols-2 items-center gap-4 rounded-2xl border border-c-border/70 bg-white p-4 shadow-sm sm:mx-5 sm:p-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1.1fr)_auto] xl:gap-2">
          <div className="col-span-2 min-w-0 sm:col-span-1">
            <label
              htmlFor="people-search"
              className="mb-1 block px-3.5 text-[11px] text-c-text-muted"
            >
              Name or skill
            </label>
            <SearchBar
              id="people-search"
              value={query}
              onChange={handleSearch}
              placeholder="Search people..."
              aria-label="Search people"
              containerClassName="[&_kbd]:hidden"
              className="!h-9 !rounded-lg !border-transparent !text-[13px] focus:!ring-1 focus:!ring-offset-0"
            />
          </div>
          {filterFields.map((field) => (
            <div
              key={field.id}
              className="min-w-0 xl:border-l xl:border-c-border xl:pl-2"
            >
              <label
                htmlFor={field.id}
                className="mb-1 block px-2 text-[11px] text-c-text-muted sm:px-3.5"
              >
                {field.label}
              </label>
              <Select
                id={field.id}
                value={field.value}
                onChange={change(field.setter)}
                options={field.options}
                aria-label={`Filter by ${field.label.toLowerCase()}`}
                title={
                  field.options.find((option) => option.value === field.value)
                    ?.label
                }
                className={`!h-9 !rounded-lg !border-transparent !pl-2 !pr-8 !text-[13px] focus:!ring-1 focus:!ring-offset-0 sm:!pl-3.5 sm:!pr-10 ${field.value ? '!font-medium !text-c-blue' : ''}`}
              />
            </div>
          ))}
          <button
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="people-filters"
            aria-label={`Filter by skills${selectedSkills.length ? `, ${selectedSkills.length} selected` : ''}`}
            title="Filter by skills"
            onClick={() => setFiltersOpen((open) => !open)}
            className={`relative flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue sm:col-span-2 xl:col-span-1 xl:h-14 xl:w-14 ${filtersOpen || selectedSkills.length ? 'bg-c-blue text-white' : 'bg-c-blue-soft text-c-blue hover:bg-c-blue-soft/70'}`}
          >
            <SlidersHorizontal size={19} aria-hidden="true" />
            <span className="xl:sr-only">Skills</span>
            {selectedSkills.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-c-yellow px-1 text-[10px] font-bold text-c-text">
                {selectedSkills.length}
              </span>
            )}
          </button>
        </div>
        {filtersOpen && (
          <div
            id="people-filters"
            className="mx-3 mt-3 rounded-2xl border border-c-border bg-white p-5 sm:mx-5"
          >
            <fieldset>
              <legend className="mb-3 text-xs font-semibold text-c-text-muted">
                Skills
              </legend>
              <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto p-1">
                {skills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    aria-pressed={selectedSkills.includes(skill)}
                    onClick={() => toggleSkill(skill)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue ${selectedSkills.includes(skill) ? 'border-c-blue bg-c-blue-soft text-c-blue' : 'border-c-border text-c-text-muted hover:border-c-blue/40'}`}
                  >
                    {skill}
                  </button>
                ))}
                {!skills.length && (
                  <p className="text-xs text-c-text-muted">
                    No skills available yet.
                  </p>
                )}
              </div>
            </fieldset>
          </div>
        )}
        {!filtersOpen && selectedSkills.length > 0 && (
          <div
            className="mx-3 mt-3 flex flex-wrap gap-2 sm:mx-5"
            aria-label="Selected skills"
          >
            {selectedSkills.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                aria-label={`Remove ${skill} filter`}
                className="inline-flex items-center gap-1.5 rounded-full border border-c-blue/15 bg-white px-3 py-1.5 text-xs text-c-blue"
              >
                {skill}
                <X size={12} aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 !text-xl !font-semibold !tracking-tight">
          {hasFilters
            ? 'Your matches'
            : sort === 'match'
              ? 'Best for you'
              : sort === 'xp'
                ? 'Community leaders'
                : 'Recently joined'}
          {people && (
            <span
              aria-label={`${people.length} people`}
              className="rounded-full bg-c-blue-soft px-2 py-0.5 text-[11px] font-medium tabular-nums text-c-blue"
            >
              {people.length}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg px-2 py-2 text-xs font-medium text-c-blue hover:underline"
            >
              Clear filters
            </button>
          )}
          <div className="w-40">
            <Select
              aria-label="Sort people"
              value={sort}
              onChange={change(setSort)}
              options={[
                { value: 'match', label: 'Best match' },
                { value: 'xp', label: 'Most XP' },
                { value: 'newest', label: 'Recently joined' },
              ]}
              className="!h-9 !rounded-full !border-transparent !bg-white/70 !text-xs !text-c-text-muted"
            />
          </div>
        </div>
      </div>
      {error && (
        <p
          className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-c-danger"
          role="alert"
        >
          {error}
        </p>
      )}
      {!people ? (
        <PeopleSkeleton />
      ) : visible.length ? (
        <>
          <div
            className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
            aria-label="People"
          >
            {visible.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                busy={busyId === person.id}
                onConnect={connect}
              />
            ))}
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            className="mt-8"
          />
        </>
      ) : (
        !error && (
          <EmptyState
            icon={Users}
            title="No people found"
            description="Try a different search or clear your filters."
            actionLabel="Clear filters"
            onAction={clearFilters}
          />
        )
      )}
    </div>
  )
}
