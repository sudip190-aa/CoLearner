// Single source of truth for project and milestone status labels. The values are the backend's.
export const PROJECT_STATUS_OPTIONS = [
  { value: 'idea', label: 'Idea', variant: 'gray' },
  { value: 'active', label: 'In progress', variant: 'blue' },
  { value: 'completed', label: 'Completed', variant: 'success' },
  { value: 'archived', label: 'Archived', variant: 'gray' },
]

export const projectStatusLabel = (value) =>
  PROJECT_STATUS_OPTIONS.find((option) => option.value === value)?.label ||
  value

export const projectStatusVariant = (value) =>
  PROJECT_STATUS_OPTIONS.find((option) => option.value === value)?.variant ||
  'gray'

export const MILESTONE_STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
]

// Projects that no longer take new members.
export const isClosedProject = (project) =>
  project.status === 'completed' || project.status === 'archived'
