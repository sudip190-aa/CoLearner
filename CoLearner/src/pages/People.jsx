import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
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
  { value: '', label: 'Any availability' },
  { value: 'open_to_collaboration', label: 'Open to collaboration' },
  { value: 'mentoring', label: 'Available for mentoring' },
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
          <div className="flex justify-between">
            <Skeleton width="56px" height="56px" />
            <Skeleton width="68px" height="24px" />
          </div>
          <Skeleton width="60%" height="20px" className="mt-5" />
          <Skeleton width="40%" height="14px" className="mt-2" />
          <Skeleton width="100%" height="40px" className="mt-4" />
          <div className="mt-4 flex gap-2">
            <Skeleton width="64px" height="24px" />
            <Skeleton width="76px" height="24px" />
          </div>
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
  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-center gap-4 lg:flex-nowrap lg:gap-6">
        <h1 className="flex w-full shrink-0 items-center gap-2.5 !text-3xl !font-bold !tracking-tight lg:w-auto">
          Discover people{' '}
          <span
            aria-hidden="true"
            className="mt-1.5 h-2 w-2 rounded-full bg-c-yellow"
          />
        </h1>
        <SearchBar
          value={query}
          onChange={handleSearch}
          placeholder="Search by name, skill, or role..."
          aria-label="Search people"
          containerClassName="min-w-0 flex-1"
          className="!h-12 !rounded-xl"
        />
        <button
          type="button"
          aria-expanded={filtersOpen}
          aria-controls="people-filters"
          onClick={() => setFiltersOpen((open) => !open)}
          className={`inline-flex h-12 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue ${filtersOpen ? 'border-c-blue bg-c-blue-soft text-c-blue' : 'border-c-border bg-white text-c-text hover:border-c-blue/40'}`}
        >
          <SlidersHorizontal size={18} aria-hidden="true" />
          <span className="hidden sm:inline">Filters</span>
          <span className="sr-only sm:hidden">Filters</span>
          {filterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-c-blue px-1 text-[10px] font-semibold text-white">
              {filterCount}
            </span>
          )}
        </button>
      </header>

      <div className="mb-6 mt-6 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          aria-expanded={filtersOpen}
          aria-controls="people-filters"
          onClick={() => setFiltersOpen((open) => !open)}
          className={`inline-flex h-10 items-center gap-3 rounded-full border bg-white px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue ${selectedSkills.length ? 'border-c-blue text-c-blue' : 'border-c-border text-c-text'}`}
        >
          Skills{selectedSkills.length > 0 && ` (${selectedSkills.length})`}
          <ChevronDown size={15} aria-hidden="true" />
        </button>
        <div className="w-32">
          <Select
            aria-label="Filter by role"
            value={role}
            onChange={change(setRole)}
            options={roles.map((option) =>
              option.value ? option : { value: '', label: 'Role' },
            )}
            className={`!rounded-full ${role ? '!border-c-blue !text-c-blue' : ''}`}
          />
        </div>
        <div className="w-44">
          <Select
            aria-label="Filter by availability"
            value={availabilityValue}
            onChange={change(setAvailabilityValue)}
            options={availability.map((option) =>
              option.value ? option : { value: '', label: 'Availability' },
            )}
            className={`!rounded-full ${availabilityValue ? '!border-c-blue !text-c-blue' : ''}`}
          />
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg px-2 py-2 text-xs font-medium text-c-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue"
          >
            Clear
          </button>
        )}
        <div className="ml-auto w-36">
          <Select
            aria-label="Sort people"
            value={sort}
            onChange={change(setSort)}
            options={[
              { value: 'match', label: 'Best match' },
              { value: 'xp', label: 'Most XP' },
              { value: 'newest', label: 'Recently joined' },
            ]}
            className="!rounded-full !border-transparent !bg-transparent !text-xs !text-c-text-muted"
          />
        </div>
      </div>

      {filtersOpen && (
        <section
          id="people-filters"
          aria-label="People filters"
          className="mb-6 rounded-2xl border border-c-border bg-white p-5"
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
            </div>
          </fieldset>
          <div className="mt-4 max-w-xs">
            <Select
              aria-label="Filter by location"
              value={location}
              onChange={change(setLocation)}
              options={[
                { value: '', label: 'All locations' },
                ...locations.map((value) => ({ value, label: value })),
              ]}
              className="!rounded-xl"
            />
          </div>
        </section>
      )}

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
