import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ImagePlus } from 'lucide-react'
import {
  Button,
  Chip,
  Input,
  Select,
  Stepper,
  Textarea,
  useToast,
} from '../components/ui'
import { PageHeader } from '../components/layout/PageHeader'
import { projects as projectsApi } from '../services/api.js'

const categories = [
  'Education',
  'Civic Tech',
  'Learning',
  'Productivity',
  'Developer Tools',
  'Collaboration',
  'Mobile',
  'Writing',
  'E-commerce',
]
const technologies = [
  'React',
  'TypeScript',
  'Python',
  'Django',
  'Node.js',
  'PostgreSQL',
  'Docker',
  'Figma',
  'Playwright',
  'Next.js',
  'SQLite',
  'D3',
]
const roles = [
  'Frontend developer',
  'Backend developer',
  'Full-stack developer',
  'Product designer',
  'UX researcher',
  'Technical writer',
  'Community host',
  'QA engineer',
]
const schema = z.object({
  title: z.string().min(4, 'Give your project a clear title.'),
  summary: z
    .string()
    .min(20, 'Add a short summary of at least 20 characters.')
    .max(255, 'Keep the summary under 255 characters.'),
  category: z.string().min(1, 'Choose a category.'),
  description: z
    .string()
    .min(40, 'Add enough detail for collaborators to understand the idea.'),
})

export default function CreateProject() {
  const [step, setStep] = useState(0)
  const [isShowcase, setIsShowcase] = useState(false)
  const [demoUrl, setDemoUrl] = useState('')
  const [repositoryUrl, setRepositoryUrl] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [cover, setCover] = useState('')
  const [coverFile, setCoverFile] = useState(null)
  const [serverErrors, setServerErrors] = useState({})
  const [techStack, setTechStack] = useState([])
  const [lookingForRoles, setLookingForRoles] = useState([])
  const [maxMembers, setMaxMembers] = useState(5)
  const [publishError, setPublishError] = useState('')
  const navigate = useNavigate()
  const toast = useToast()
  const {
    register,
    trigger,
    getValues,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { category: '' },
  })
  const next = async () => {
    const fields =
      step === 0 ? ['title', 'summary', 'category'] : ['description']
    if (await trigger(fields)) setStep((value) => Math.min(2, value + 1))
  }
  const back = () => setStep((value) => Math.max(0, value - 1))
  const toggle = (setter, value) =>
    setter((values) =>
      values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value],
    )
  const uploadCover = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    const reader = new FileReader()
    reader.onload = () => setCover(String(reader.result))
    reader.readAsDataURL(file)
  }
  const publish = async (data) => {
    setPublishError('')
    setServerErrors({})
    try {
      const { project, xpAwarded, coverError } =
        await projectsApi.createProject({
          title: data.title,
          summary: data.summary,
          description: data.description,
          category: data.category,
          techStack,
          lookingForRoles,
          maxMembers,
          status: isShowcase ? 'completed' : 'idea',
          isShowcase,
          demoUrl,
          repositoryUrl,
          isPublic,
          cover: coverFile,
        })
      // Only claim XP the server actually paid (project XP has a daily limit).
      if (xpAwarded > 0) toast.success(`+${xpAwarded} XP`, 'Project published')
      else toast.success('Project published')
      if (coverError) toast.error('Cover not saved', coverError)
      navigate(`/projects/${project.slug}`)
    } catch (error) {
      const fields = Object.fromEntries(
        Object.entries(error?.fields || {}).map(([key, value]) => [
          key.replace(/_([a-z])/g, (_, char) => char.toUpperCase()),
          Array.isArray(value) ? value[0] : value,
        ]),
      )
      setServerErrors(fields)
      const firstStep = ['title', 'summary', 'category', 'cover'].some(
        (key) => fields[key],
      )
        ? 0
        : 1
      if (Object.keys(fields).length) setStep(firstStep)
      setPublishError(
        Object.keys(fields).length
          ? 'Please fix the highlighted fields.'
          : error?.message || 'We could not publish this project.',
      )
    }
  }
  const values = getValues()
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Create a project"
        subtitle="Give your next idea a team, a shape, and a way forward."
      />
      <div className="mb-8">
        <Stepper
          currentStep={step}
          onStepClick={setStep}
          steps={[
            { title: 'Basics', description: 'The idea' },
            { title: 'Details', description: 'The team' },
            { title: 'Review', description: 'Ready to publish' },
          ]}
        />
      </div>
      <form
        onSubmit={handleSubmit(publish)}
        className="rounded-brand-lg border border-c-border bg-white p-5 shadow-sm sm:p-8"
      >
        {step === 0 && (
          <section>
            <h2 className="text-2xl font-bold text-c-text">
              Start with the basics
            </h2>
            <p className="mt-2 text-sm text-c-text-muted">
              Make the idea easy for a potential teammate to understand.
            </p>
            <div className="mt-6 space-y-5">
              <label className="flex items-center gap-3 rounded-xl bg-c-blue-wash p-4 text-sm">
                <input
                  type="checkbox"
                  checked={isShowcase}
                  onChange={(event) => setIsShowcase(event.target.checked)}
                  className="accent-c-blue"
                />
                Showcase a project I have already built
              </label>
              <Input
                label="Live demo URL"
                type="url"
                value={demoUrl}
                onChange={(event) => setDemoUrl(event.target.value)}
                placeholder="https://your-project.com"
              />
              <Input
                label="Repository URL"
                type="url"
                value={repositoryUrl}
                onChange={(event) => setRepositoryUrl(event.target.value)}
                placeholder="https://github.com/you/project"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(event) => setIsPublic(event.target.checked)}
                  className="accent-c-blue"
                />
                Public project
              </label>
              <Input
                label="Project title"
                placeholder="Open Path"
                error={errors.title?.message || serverErrors.title}
                {...register('title')}
              />
              <Textarea
                label="Short summary"
                rows={3}
                placeholder="A clear one-sentence description of what you are building."
                error={errors.summary?.message || serverErrors.summary}
                {...register('summary')}
              />
              <Select
                label="Category"
                placeholder="Choose a category"
                options={categories}
                error={errors.category?.message || serverErrors.category}
                {...register('category')}
              />
              <div>
                <p className="mb-2 text-sm font-semibold text-c-text">
                  Cover image{' '}
                  <span className="font-normal text-c-text-muted">
                    (optional)
                  </span>
                </p>
                <label
                  htmlFor="project-cover"
                  className="flex aspect-[3/1] cursor-pointer items-center justify-center overflow-hidden rounded-brand border border-dashed border-c-border bg-c-blue-wash text-sm text-c-text-muted hover:border-c-blue hover:text-c-blue"
                >
                  {cover ? (
                    <img
                      src={cover}
                      alt="Project cover preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex items-center gap-2">
                      <ImagePlus className="h-5 w-5" />
                      Upload a cover
                    </span>
                  )}
                  <input
                    id="project-cover"
                    type="file"
                    accept="image/*"
                    onChange={uploadCover}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>
          </section>
        )}
        {step === 1 && (
          <section>
            <h2 className="text-2xl font-bold text-c-text">Shape the team</h2>
            <p className="mt-2 text-sm text-c-text-muted">
              Choose the tools and roles that will help this idea move.
            </p>
            <div className="mt-6 space-y-7">
              <Textarea
                label="Full description"
                rows={7}
                placeholder="What are you building, who is it for, and what will a first version prove?"
                error={errors.description?.message || serverErrors.description}
                {...register('description')}
              />
              <div>
                <p className="mb-3 text-sm font-semibold text-c-text">
                  Tech stack
                </p>
                {serverErrors.techStack && (
                  <p className="mb-2 text-xs text-c-danger" role="alert">
                    {serverErrors.techStack}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {technologies.map((item) => (
                    <Chip
                      key={item}
                      selected={techStack.includes(item)}
                      onClick={() => toggle(setTechStack, item)}
                    >
                      {item}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-semibold text-c-text">
                  Roles wanted
                </p>
                <div className="flex flex-wrap gap-2">
                  {roles.map((item) => (
                    <Chip
                      key={item}
                      selected={lookingForRoles.includes(item)}
                      onClick={() => toggle(setLookingForRoles, item)}
                    >
                      {item}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="max-members"
                    className="text-sm font-semibold text-c-text"
                  >
                    Maximum members
                  </label>
                  <span className="text-sm font-bold text-c-blue">
                    {maxMembers}
                  </span>
                </div>
                <input
                  id="max-members"
                  type="range"
                  min="2"
                  max="10"
                  value={maxMembers}
                  onChange={(event) =>
                    setMaxMembers(Number(event.target.value))
                  }
                  className="mt-3 w-full accent-c-blue"
                />
                <div className="flex justify-between text-xs text-c-text-muted">
                  <span>2 people</span>
                  <span>10 people</span>
                </div>
              </div>
            </div>
          </section>
        )}
        {step === 2 && (
          <section>
            <h2 className="text-2xl font-bold text-c-text">
              Review your project
            </h2>
            <p className="mt-2 text-sm text-c-text-muted">
              Everything look right? Publish it and start finding your team.
            </p>
            <div className="mt-6 overflow-hidden rounded-brand border border-c-border">
              <div className="h-36 bg-c-blue-wash">
                {cover && (
                  <img
                    src={cover}
                    alt="Project cover preview"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="space-y-5 p-5">
                <div>
                  <h3 className="text-xl font-bold text-c-text">
                    {values.title || 'Untitled project'}
                  </h3>
                  <p className="mt-1 text-sm text-c-text-muted">
                    {values.category || 'No category'} · {maxMembers} members
                    maximum
                  </p>
                </div>
                <p className="text-sm leading-6 text-c-text-muted">
                  {values.summary}
                </p>
                <p className="whitespace-pre-wrap text-sm leading-6 text-c-text">
                  {values.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {techStack.map((item) => (
                    <Chip key={item}>{item}</Chip>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-c-text-muted">
                    Looking for
                  </p>
                  <p className="mt-2 text-sm text-c-text">
                    {lookingForRoles.length
                      ? lookingForRoles.join(' · ')
                      : 'Open to all collaborators'}
                  </p>
                </div>
              </div>
            </div>
            {publishError && (
              <p className="mt-4 text-sm font-medium text-c-danger">
                {publishError}
              </p>
            )}
          </section>
        )}
        <div className="mt-8 flex items-center justify-between border-t border-c-border pt-5">
          <Button
            type="button"
            variant="ghost"
            onClick={back}
            disabled={step === 0}
          >
            Back
          </Button>
          {step < 2 ? (
            <Button type="button" onClick={next}>
              Continue
            </Button>
          ) : (
            <Button type="submit" loading={isSubmitting}>
              Publish project
            </Button>
          )}
        </div>
      </form>
      <p className="mt-5 text-center text-sm text-c-text-muted">
        <Link to="/projects" className="text-c-blue hover:underline">
          Cancel and return to projects
        </Link>
      </p>
    </div>
  )
}
