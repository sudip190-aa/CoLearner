import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, SlidersHorizontal } from 'lucide-react'
import {
  Avatar,
  Button,
  EmptyState,
  Pagination,
  SearchBar,
  Select,
  Skeleton,
  useToast,
} from '../components/ui'
import { PageHeader } from '../components/layout/PageHeader'
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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

function SuggestedPerson({ person }) {
  const reason = person.sharedSkills[0] || person.skills[0]?.name
  return (
    <Link
      to={`/u/${person.username}`}
      className="group flex min-w-[220px] flex-1 items-center gap-3 rounded-brand-lg border border-c-border bg-white p-4 shadow-sm hover:border-c-blue"
    >
      <Avatar src={person.avatar} name={person.fullName} size="md" />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-c-text group-hover:text-c-blue">
          {person.fullName}
        </p>
        <p className="mt-1 truncate text-xs text-c-text-muted">
          {reason ? `Also learning ${reason}` : person.headline}
        </p>
      </div>
      <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-c-text-muted group-hover:text-c-blue" />
    </Link>
  )
}

function Filters({
  selectedSkills,
  onSkillToggle,
  role,
  setRole,
  availabilityValue,
  setAvailabilityValue,
  location,
  setLocation,
  skills,
  locations,
}) {
  return (
    <aside className="space-y-5 rounded-brand-lg border border-c-border bg-white p-5">
      <div>
        <h2 className="text-sm font-bold text-c-text">Filter people</h2>
        <p className="mt-1 text-xs text-c-text-muted">
          Find peers who are learning alongside you.
        </p>
      </div>
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wide text-c-text-muted">
          Skills
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <button
              type="button"
              key={skill}
              onClick={() => onSkillToggle(skill)}
              className={`rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors ${selectedSkills.includes(skill) ? 'border-c-blue bg-c-blue text-white' : 'border-c-border bg-white text-c-text-muted hover:border-c-blue hover:text-c-blue'}`}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>
      <Select
        label="Role"
        value={role}
        onChange={(event) => setRole(event.target.value)}
        options={roles}
      />
      <Select
        label="Availability"
        value={availabilityValue}
        onChange={(event) => setAvailabilityValue(event.target.value)}
        options={availability}
      />
      <Select
        label="Location"
        value={location}
        onChange={(event) => setLocation(event.target.value)}
        options={[
          { value: '', label: 'Everywhere' },
          ...locations.map((item) => ({ value: item, label: item })),
        ]}
      />
    </aside>
  )
}

export default function People() {
  const toast = useToast()
  const [people, setPeople] = useState(null)
  const [suggested, setSuggested] = useState([])
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

  // Facets and suggestions: loaded once.
  useEffect(() => {
    let active = true
    Promise.all([users.getSkills(), users.getUsers(), users.getSuggested()])
      .then(([skillResult, everyone, suggestions]) => {
        if (!active) return
        setSkills(skillResult.skills.slice(0, 16).map((skill) => skill.name))
        setLocations(
          [...new Set(everyone.items.map((person) => person.location).filter(Boolean))].sort(),
        )
        setSuggested(suggestions.items)
      })
      .catch(() => {
        // Facets and suggestions are optional; the list below reports its own errors.
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
        setPeople(items)
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
  }, [query, selectedSkills, role, availabilityValue, location, sort])

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
    setSuggested((list) => patch(list))
  }
  const connect = async (person, action) => {
    if (!action) return
    setBusyId(person.id)
    try {
      const result = await users.connect(person.username, action)
      applyConnection(person.username, result.connectionStatus)
      if (action === 'connect') toast.success('Request sent', `We let ${person.fullName} know`)
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
  const filterProps = {
    selectedSkills,
    onSkillToggle: toggleSkill,
    role,
    setRole: (value) => {
      resetPage()
      setRole(value)
    },
    availabilityValue,
    setAvailabilityValue: (value) => {
      resetPage()
      setAvailabilityValue(value)
    },
    location,
    setLocation: (value) => {
      resetPage()
      setLocation(value)
    },
    skills,
    locations,
  }
  return (
    <div>
      <PageHeader
        title="People"
        subtitle="Meet learners, builders, and mentors who can help you move from learning to doing."
      />
      {suggested.length > 0 && (
        <section>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-c-text">
                Suggested for you
              </h2>
              <p className="mt-1 text-sm text-c-text-muted">
                People with skills that overlap your learning path.
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2 xl:grid xl:grid-cols-4">
            {suggested.map((person) => (
              <SuggestedPerson key={person.id} person={person} />
            ))}
          </div>
        </section>
      )}
      <div className="mt-10 grid items-start gap-8 xl:grid-cols-[230px_minmax(0,1fr)]">
        <div className="xl:hidden">
          <Button
            variant="outline"
            icon={SlidersHorizontal}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            Filters
          </Button>
          {filtersOpen && (
            <div className="mt-4">
              <Filters {...filterProps} />
            </div>
          )}
        </div>
        <div className="hidden xl:block">
          <Filters {...filterProps} />
        </div>
        <main className="min-w-0">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row">
            <SearchBar
              value={query}
              onChange={handleSearch}
              placeholder="Search by name or headline..."
              containerClassName="flex-1"
            />
            <Select
              value={sort}
              onChange={(event) => {
                resetPage()
                setSort(event.target.value)
              }}
              options={[
                { value: 'match', label: 'Best match' },
                { value: 'xp', label: 'Most XP' },
                { value: 'newest', label: 'Newest' },
              ]}
              className="sm:w-40"
            />
          </div>
          {error && (
            <p className="mb-4 rounded-brand bg-red-50 px-3 py-2 text-sm text-c-danger" role="alert">
              {error}
            </p>
          )}
          {!people ? (
            <PeopleSkeleton />
          ) : visible.length ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                description="Try widening your search or removing a filter."
                actionLabel="Clear filters"
                onAction={clearFilters}
              />
            )
          )}
        </main>
      </div>
    </div>
  )
}
