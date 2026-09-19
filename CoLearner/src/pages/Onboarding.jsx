import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ImagePlus,
  Search,
  ArrowLeft,
  ArrowRight,
  Check,
  Code2,
  Compass,
  HeartHandshake,
} from 'lucide-react'
import { Button, Input, Stepper, Textarea, useToast } from '../components/ui'
import { auth, users } from '../services/api'
import { BOOK_CATEGORIES } from '../lib/constants.js'
import { useAuthStore } from '../store/authStore'
import { useOnboardingStore } from '../store/onboardingStore'

const paths = [
  {
    value: 'learner',
    title: 'Learner',
    description: 'Build a steady practice with curated paths.',
    icon: Compass,
  },
  {
    value: 'builder',
    title: 'Builder',
    description: 'Turn ideas into real projects with peers.',
    icon: Code2,
  },
  {
    value: 'mentor',
    title: 'Mentor',
    description: 'Help others make their next step clearer.',
    icon: HeartHandshake,
  },
]
const profileSchema = z.object({
  headline: z.string().min(3, 'Add a short headline.'),
  bio: z.string().min(20, 'Tell people a little more about you.'),
  location: z.string().min(2, 'Add your location.'),
  github: z.string().url('Use a full URL.').or(z.literal('')),
  linkedin: z.string().url('Use a full URL.').or(z.literal('')),
  website: z.string().url('Use a full URL.').or(z.literal('')),
})

export default function Onboarding() {
  const navigate = useNavigate()
  const toast = useToast()
  const setUser = useAuthStore((state) => state.setUser)
  const currentXp = useAuthStore((state) => state.user?.xp ?? 0)
  const { step, setStep, draft, updateDraft, updateProfile, reset } =
    useOnboardingStore()
  const [query, setQuery] = useState('')
  const [catalog, setCatalog] = useState([])
  const [catalogError, setCatalogError] = useState('')
  const [avatar, setAvatar] = useState(draft.profile.avatar || '')
  const [avatarFile, setAvatarFile] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const {
    register,
    handleSubmit,
    setError: setFormError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: draft.profile,
  })

  useEffect(() => {
    let active = true
    users
      .getSkills()
      .then(({ skills }) => active && setCatalog(skills))
      .catch(() => active && setCatalogError('Could not load skills. You can still add your own.'))
    return () => {
      active = false
    }
  }, [])

  const selectedSkills = draft.skills
  const selectedInterests = draft.interests
  const trimmedQuery = query.trim()
  const filteredSkills = useMemo(
    () =>
      catalog.filter((skill) =>
        skill.name.toLowerCase().includes(trimmedQuery.toLowerCase()),
      ),
    [catalog, trimmedQuery],
  )
  // Anything typed that isn't in the catalog can be added as a brand-new skill.
  const canAddCustom =
    trimmedQuery.length > 0 &&
    ![...catalog.map((skill) => skill.name), ...selectedSkills].some(
      (name) => name.toLowerCase() === trimmedQuery.toLowerCase(),
    )
  const customSelected = selectedSkills.filter(
    (name) => !catalog.some((skill) => skill.name === name),
  )
  const toggle = (key, value) => {
    const values = draft[key].includes(value)
      ? draft[key].filter((item) => item !== value)
      : [...draft[key], value]
    updateDraft({ [key]: values })
  }
  const finish = async (profile) => {
    setSubmitError('')
    updateProfile({ ...profile, avatar })
    try {
      const { user } = await auth.completeOnboarding({
        role: draft.path,
        skills: selectedSkills,
        interests: selectedInterests,
        ...profile,
      })
      let saved = user
      if (avatarFile) saved = (await auth.updateMe({ avatar: avatarFile })).user
      setUser(saved)
      reset()
      const earned = Math.max(0, saved.xp - currentXp)
      toast.success(earned ? `+${earned} XP — profile complete` : 'Profile saved')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      Object.entries(error?.fields || {}).forEach(([key, value]) => {
        if (key in profileSchema.shape) {
          setFormError(key, {
            type: 'server',
            message: Array.isArray(value) ? value[0] : value,
          })
        }
      })
      setSubmitError(error?.message || 'We could not save your profile.')
    }
  }
  const next = () => setStep(Math.min(step + 1, 3))
  const back = () => setStep(Math.max(step - 1, 0))
  const choosePath = (path) => updateDraft({ path })
  const onAvatar = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = () => setAvatar(String(reader.result))
      reader.readAsDataURL(file)
    }
  }
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <Stepper
          currentStep={step}
          onStepClick={setStep}
          steps={[
            { title: 'Your path' },
            { title: 'Skills' },
            { title: 'Interests' },
            { title: 'Profile' },
          ]}
        />
      </div>
      <div className="rounded-brand-lg border border-c-border bg-white p-5 shadow-sm sm:p-8">
        {step === 0 && (
          <div>
            <h1 className="text-2xl font-bold">Pick your path</h1>
            <p className="mt-2 text-sm text-c-text-muted">
              You can change this later. It helps us shape your first Colearn
              experience.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {paths.map(({ value, title, description, icon: Icon }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => choosePath(value)}
                  className={`rounded-brand-lg border p-5 text-left transition-colors ${draft.path === value ? 'border-c-blue bg-c-blue-soft text-c-blue' : 'border-c-border hover:border-c-blue'}`}
                >
                  <Icon className="h-7 w-7" />
                  <h2 className="mt-5 text-lg font-semibold text-c-text">
                    {title}
                  </h2>
                  <p className="mt-2 text-sm leading-5 text-c-text-muted">
                    {description}
                  </p>
                  {draft.path === value && <Check className="mt-4 h-5 w-5" />}
                </button>
              ))}
            </div>
          </div>
        )}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold">Pick your skills</h1>
            <p className="mt-2 text-sm text-c-text-muted">
              Choose at least three skills you want to practice.
            </p>
            <div className="relative mt-6">
              <Search className="absolute left-3 top-3 h-4 w-4 text-c-text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search skills"
                className="h-10 w-full rounded-brand border border-c-border pl-10 text-sm focus:border-c-blue focus:outline-none focus:ring-2 focus:ring-c-blue"
              />
            </div>
            {catalogError && (
              <p className="mt-3 text-sm text-c-danger" role="alert">
                {catalogError}
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              {[...customSelected.map((name) => ({ id: `custom-${name}`, name })), ...filteredSkills].map((skill) => (
                <button
                  type="button"
                  key={skill.id}
                  onClick={() => toggle('skills', skill.name)}
                  className={`rounded-full border px-3 py-2 text-sm ${selectedSkills.includes(skill.name) ? 'border-c-blue bg-c-blue text-white' : 'border-c-border text-c-text-muted hover:border-c-blue hover:text-c-blue'}`}
                >
                  {skill.name}
                </button>
              ))}
              {canAddCustom && (
                <button
                  type="button"
                  onClick={() => {
                    toggle('skills', trimmedQuery)
                    setQuery('')
                  }}
                  className="rounded-full border border-dashed border-c-blue px-3 py-2 text-sm font-medium text-c-blue hover:bg-c-blue-soft"
                >
                  + Add “{trimmedQuery}”
                </button>
              )}
            </div>
            <p
              className={`mt-4 text-sm ${selectedSkills.length >= 3 ? 'text-c-success' : 'text-c-text-muted'}`}
            >
              {selectedSkills.length} selected{' '}
              {selectedSkills.length < 3 && '(choose 3 or more)'}
            </p>
          </div>
        )}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold">Pick your interests</h1>
            <p className="mt-2 text-sm text-c-text-muted">
              Choose the topics you want to see more often.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {BOOK_CATEGORIES.map((category) => (
                <button
                  type="button"
                  key={category.id}
                  onClick={() => toggle('interests', category.id)}
                  className={`rounded-brand border px-4 py-3 text-sm font-medium ${selectedInterests.includes(category.id) ? 'border-c-blue bg-c-blue text-white' : 'border-c-border text-c-text-muted hover:border-c-blue hover:text-c-blue'}`}
                >
                  {category.name}
                </button>
              ))}
            </div>
            <p className="mt-4 text-sm text-c-text-muted">
              {selectedInterests.length} selected
            </p>
          </div>
        )}
        {step === 3 && (
          <form onSubmit={handleSubmit(finish)}>
            <h1 className="text-2xl font-bold">Complete your profile</h1>
            <p className="mt-2 text-sm text-c-text-muted">
              A little context helps the right people find you.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <label
                className="flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-c-border bg-c-blue-soft text-c-blue"
                htmlFor="avatar"
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImagePlus className="h-6 w-6" />
                )}
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={onAvatar}
                />
              </label>
              <div>
                <p className="text-sm font-semibold">Profile photo</p>
                <p className="text-xs text-c-text-muted">
                  Optional. JPG or PNG.
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-4">
              <Input
                label="Headline"
                placeholder="Frontend developer building thoughtful tools"
                error={errors.headline?.message}
                {...register('headline')}
              />
              <Textarea
                label="Bio"
                rows={4}
                placeholder="What are you learning or building?"
                error={errors.bio?.message}
                {...register('bio')}
              />
              <Input
                label="Location"
                placeholder="Toronto, Canada"
                error={errors.location?.message}
                {...register('location')}
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  label="GitHub"
                  placeholder="https://github.com/..."
                  error={errors.github?.message}
                  {...register('github')}
                />
                <Input
                  label="LinkedIn"
                  placeholder="https://linkedin.com/in/..."
                  error={errors.linkedin?.message}
                  {...register('linkedin')}
                />
                <Input
                  label="Website"
                  placeholder="https://..."
                  error={errors.website?.message}
                  {...register('website')}
                />
              </div>
            </div>
            {submitError && (
              <p className="mt-4 text-sm font-medium text-c-danger" role="alert">
                {submitError}
              </p>
            )}
          </form>
        )}
        <div className="mt-8 flex items-center justify-between border-t border-c-border pt-5">
          <Button
            type="button"
            variant="ghost"
            icon={ArrowLeft}
            onClick={back}
            disabled={step === 0}
          >
            Back
          </Button>
          {step < 3 ? (
            <div className="flex gap-3">
              {step > 0 && (
                <Button type="button" variant="ghost" onClick={next}>
                  Skip
                </Button>
              )}
              <Button
                type="button"
                onClick={next}
                disabled={
                  (step === 0 && !draft.path) ||
                  (step === 1 && selectedSkills.length < 3)
                }
                icon={ArrowRight}
                iconPosition="right"
              >
                Continue
              </Button>
            </div>
          ) : (
            <Button
              type="submit"
              loading={isSubmitting}
              onClick={handleSubmit(finish)}
            >
              Finish setup
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
