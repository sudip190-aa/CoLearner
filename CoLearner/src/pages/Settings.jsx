import React, { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Lock, User, Trash2 } from 'lucide-react'
import {
  Avatar,
  Button,
  Input,
  Modal,
  Select,
  Textarea,
  useToast,
} from '../components/ui'
import { PageHeader } from '../components/layout/PageHeader'
import { auth } from '../services/api'
import { useAuthStore } from '../store/authStore'

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'account', label: 'Account', icon: Lock },
  { id: 'danger', label: 'Danger zone', icon: AlertTriangle },
]

const firstMessage = (value) => (Array.isArray(value) ? value[0] : value)

// Map the API's snake_case field errors onto this form's field names.
const fieldErrorsFor = (error, mapping) =>
  Object.fromEntries(
    Object.entries(error?.fields || {})
      .filter(([key]) => key in mapping)
      .map(([key, value]) => [mapping[key], firstMessage(value)]),
  )

const profileFromUser = (user) => ({
  role: user?.role || 'learner',
  notificationSound: user?.notificationSound !== false,
  fullName: user?.fullName || '',
  username: user?.username || '',
  headline: user?.headline || '',
  bio: user?.bio || '',
  location: user?.location || '',
  github: user?.links?.github || '',
  linkedin: user?.links?.linkedin || '',
  website: user?.links?.website || '',
  skills: (user?.skills || []).map((skill) => skill.name).join(', '),
})

const parseSkills = (text) => [
  ...new Map(
    text
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => [name.toLowerCase(), name]),
  ).values(),
]

const profileErrorMap = {
  full_name: 'fullName',
  username: 'username',
  headline: 'headline',
  bio: 'bio',
  location: 'location',
  github: 'github',
  linkedin: 'linkedin',
  website: 'website',
  avatar: 'avatar',
  skills: 'skills',
}

function SettingsSection({ title, description, children, footer }) {
  return (
    <section className="rounded-brand-lg border border-c-border bg-white p-5 shadow-sm sm:p-7">
      <div className="border-b border-c-border pb-5">
        <h2 className="text-xl font-bold text-c-text">{title}</h2>
        <p className="mt-1 text-sm text-c-text-muted">{description}</p>
      </div>
      <div className="space-y-5 pt-6">{children}</div>
      {footer}
    </section>
  )
}

function ProfileTab() {
  const toast = useToast()
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const [form, setForm] = useState(() => profileFromUser(user))
  const [saved, setSaved] = useState(() => profileFromUser(user))
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const fileInput = useRef(null)

  const dirty =
    Boolean(avatarFile) || JSON.stringify(form) !== JSON.stringify(saved)

  useEffect(() => {
    const handler = (event) => {
      if (dirty) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  useEffect(
    () => () => avatarPreview && URL.revokeObjectURL(avatarPreview),
    [avatarPreview],
  )

  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }))
  const pickAvatar = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const save = async () => {
    setSaving(true)
    setErrors({})
    setFormError('')
    try {
      const { user: updated } = await auth.updateMe({
        role: form.role,
        notificationSound: form.notificationSound,
        fullName: form.fullName,
        username: form.username,
        headline: form.headline,
        bio: form.bio,
        location: form.location,
        github: form.github,
        linkedin: form.linkedin,
        website: form.website,
        ...(avatarFile ? { avatar: avatarFile } : {}),
      })
      let latest = updated
      if (form.skills !== saved.skills) {
        latest = (await auth.setSkills(parseSkills(form.skills))).user
      }
      setUser(latest)
      const next = profileFromUser(latest)
      setForm(next)
      setSaved(next)
      setAvatarFile(null)
      setAvatarPreview('')
      toast.success('Settings saved', 'Your profile is up to date')
    } catch (error) {
      setErrors(fieldErrorsFor(error, profileErrorMap))
      setFormError(error?.message || 'We could not save your changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SettingsSection
      title="Profile"
      description="This information appears on your public profile."
      footer={
        <div className="mt-7 border-t border-c-border pt-5">
          {formError && (
            <p className="mb-3 text-sm font-medium text-c-danger" role="alert">
              {formError}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-c-text-muted">
              {dirty ? 'Unsaved changes' : 'All changes saved'}
            </span>
            <Button onClick={save} loading={saving} disabled={!dirty}>
              Save changes
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex items-center gap-4">
        <Avatar
          src={avatarPreview || user?.avatar}
          name={form.fullName || user?.username}
          size="xl"
        />
        <div>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={pickAvatar}
            aria-label="Profile photo"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInput.current?.click()}
          >
            Change avatar
          </Button>
          <p className="mt-1 text-xs text-c-text-muted">
            JPG, PNG or WebP, up to 2&nbsp;MB.
          </p>
          {errors.avatar && (
            <p className="mt-1 text-xs text-c-danger" role="alert">
              {errors.avatar}
            </p>
          )}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          label="CoLearn role"
          value={form.role}
          onChange={(event) => update('role', event.target.value)}
          options={[
            { value: 'learner', label: 'Learner' },
            { value: 'mentor', label: 'Mentor' },
            ...(['learner', 'mentor'].includes(form.role)
              ? []
              : [{ value: form.role, label: form.role }]),
          ]}
        />
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={form.notificationSound}
            onChange={(event) =>
              update('notificationSound', event.target.checked)
            }
            className="accent-c-blue"
          />
          Notification sounds
        </label>
        <Input
          label="Name"
          value={form.fullName}
          error={errors.fullName}
          onChange={(event) => update('fullName', event.target.value)}
        />
        <Input
          label="Username"
          value={form.username}
          error={errors.username}
          hint="Changing this changes your profile link."
          onChange={(event) => update('username', event.target.value)}
        />
        <Input
          label="Headline"
          value={form.headline}
          error={errors.headline}
          onChange={(event) => update('headline', event.target.value)}
          containerClassName="sm:col-span-2"
        />
        <Textarea
          label="Bio"
          rows={5}
          value={form.bio}
          error={errors.bio}
          onChange={(event) => update('bio', event.target.value)}
          containerClassName="sm:col-span-2"
        />
        <Input
          label="Location"
          value={form.location}
          error={errors.location}
          onChange={(event) => update('location', event.target.value)}
        />
        <Input
          label="Skills"
          hint="Separate skills with commas."
          value={form.skills}
          error={errors.skills}
          onChange={(event) => update('skills', event.target.value)}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <Input
          label="GitHub"
          value={form.github}
          error={errors.github}
          placeholder="https://github.com/..."
          onChange={(event) => update('github', event.target.value)}
        />
        <Input
          label="LinkedIn"
          value={form.linkedin}
          error={errors.linkedin}
          placeholder="https://linkedin.com/in/..."
          onChange={(event) => update('linkedin', event.target.value)}
        />
        <Input
          label="Website"
          value={form.website}
          error={errors.website}
          placeholder="https://..."
          onChange={(event) => update('website', event.target.value)}
        />
      </div>
    </SettingsSection>
  )
}

const emptyPasswords = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

function AccountTab() {
  const toast = useToast()
  const email = useAuthStore((state) => state.user?.email)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyPasswords)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const close = () => {
    setOpen(false)
    setForm(emptyPasswords)
    setErrors({})
    setFormError('')
  }
  const submit = async (event) => {
    event.preventDefault()
    if (form.newPassword !== form.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match.' })
      return
    }
    setSaving(true)
    setErrors({})
    setFormError('')
    try {
      await auth.changePassword(form)
      toast.success('Password changed', 'Your other devices were signed out')
      close()
    } catch (error) {
      setErrors(
        fieldErrorsFor(error, {
          current_password: 'currentPassword',
          new_password: 'newPassword',
          new_password2: 'confirmPassword',
        }),
      )
      setFormError(error?.message || 'We could not change your password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SettingsSection
      title="Account"
      description="Manage how you sign in to Colearn."
    >
      <Input
        label="Email address"
        type="email"
        value={email || ''}
        readOnly
        hint="This is the address you sign in with."
      />
      <div className="flex items-center justify-between rounded-brand bg-c-blue-wash p-4">
        <div>
          <p className="text-sm font-semibold text-c-text">Password</p>
          <p className="mt-1 text-xs text-c-text-muted">
            Changing it signs you out on your other devices.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Change password
        </Button>
      </div>
      <Modal isOpen={open} onClose={close} title="Change password">
        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={form.currentPassword}
            error={errors.currentPassword}
            onChange={(event) =>
              setForm((f) => ({ ...f, currentPassword: event.target.value }))
            }
          />
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            value={form.newPassword}
            error={errors.newPassword}
            onChange={(event) =>
              setForm((f) => ({ ...f, newPassword: event.target.value }))
            }
          />
          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            error={errors.confirmPassword}
            onChange={(event) =>
              setForm((f) => ({ ...f, confirmPassword: event.target.value }))
            }
          />
          {formError && (
            <p className="text-sm font-medium text-c-danger" role="alert">
              {formError}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={saving}
              disabled={!form.currentPassword || form.newPassword.length < 8}
            >
              Update password
            </Button>
          </div>
        </form>
      </Modal>
    </SettingsSection>
  )
}

function DangerTab() {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const close = () => {
    setOpen(false)
    setConfirmText('')
    setPassword('')
    setError('')
  }
  const remove = async () => {
    setDeleting(true)
    setError('')
    try {
      await auth.deleteAccount(password) // also clears the stored tokens
      // A full page load (not a router navigation): the route guard would otherwise bounce to
      // /login?next=/settings first, and it discards every in-memory copy of the deleted account's data.
      window.location.replace('/')
    } catch (submitError) {
      setError(
        firstMessage(submitError?.fields?.password) ||
          submitError?.message ||
          'We could not delete your account.',
      )
      setDeleting(false)
    }
  }

  return (
    <>
      <section className="rounded-brand-lg border border-c-danger/30 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-c-danger">Danger zone</h2>
        <p className="mt-1 text-sm text-c-text-muted">
          These actions affect your account and cannot be undone.
        </p>
        <div className="mt-6 flex items-center justify-between gap-4 py-4">
          <div>
            <p className="text-sm font-semibold text-c-text">Delete account</p>
            <p className="mt-1 text-xs text-c-text-muted">
              Permanently remove your account, projects, posts and learning
              record.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={() => setOpen(true)}
          >
            Delete
          </Button>
        </div>
      </section>
      <Modal
        isOpen={open}
        onClose={close}
        title="Delete your account"
        description="This action cannot be undone."
      >
        <div className="rounded-brand bg-red-50 p-4 text-sm leading-6 text-c-danger">
          Type <strong>DELETE</strong> and enter your password to permanently
          delete your account.
        </div>
        <Input
          className="mt-5"
          label="Confirmation"
          value={confirmText}
          onChange={(event) => setConfirmText(event.target.value)}
          placeholder="DELETE"
        />
        <Input
          className="mt-4"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          error={error}
          onChange={(event) => setPassword(event.target.value)}
        />
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleting}
            disabled={confirmText !== 'DELETE' || !password}
            onClick={remove}
          >
            Delete account
          </Button>
        </div>
      </Modal>
    </>
  )
}

export default function Settings() {
  const [tab, setTab] = useState('profile')
  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Shape your Colearn profile and manage your account."
      />
      <div className="grid gap-8 lg:grid-cols-[210px_minmax(0,1fr)]">
        <nav
          className="flex gap-1 overflow-x-auto lg:flex-col"
          aria-label="Settings sections"
        >
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              onClick={() => setTab(id)}
              className={`flex shrink-0 items-center gap-3 rounded-brand px-3 py-2.5 text-left text-sm font-semibold ${tab === id ? 'bg-c-blue-soft text-c-blue' : 'text-c-text-muted hover:bg-slate-50'}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
        {/* Tabs stay mounted (just hidden) so unsaved profile edits survive a tab switch. */}
        <main>
          <div hidden={tab !== 'profile'}>
            <ProfileTab />
          </div>
          <div hidden={tab !== 'account'}>
            <AccountTab />
          </div>
          <div hidden={tab !== 'danger'}>
            <DangerTab />
          </div>
        </main>
      </div>
    </div>
  )
}
