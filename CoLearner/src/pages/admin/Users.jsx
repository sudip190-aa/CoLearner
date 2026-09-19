import React, { useState } from 'react'
import { Ban, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react'
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  Input,
  Modal,
  Select,
  Skeleton,
  useToast,
} from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  ConfirmModal,
  ListError,
  Pager,
  TableShell,
  THead,
  formatDay,
  useAdminList,
  useDebounced,
} from '../../components/admin/AdminParts.jsx'
import { admin } from '../../services/api.js'
import { useAuthStore } from '../../store/authStore.js'

const ROLES = ['learner', 'builder', 'mentor', 'admin']
const EMPTY_FORM = {
  email: '',
  username: '',
  fullName: '',
  role: 'learner',
  password: '',
}

function CreateUserModal({ onClose, onCreated }) {
  const toast = useToast()
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (name) => (event) =>
    setForm((current) => ({ ...current, [name]: event.target.value }))
  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setErrors({})
    try {
      const { user } = await admin.adminCreateUser({
        ...form,
        password: form.password || undefined,
      })
      toast.success(
        'User created',
        `${user.fullName || user.username} can sign in${form.password ? '' : ' after using "Forgot password"'}`,
      )
      onCreated()
      onClose()
    } catch (error) {
      setErrors(
        error?.fields || {
          form: [error?.message || 'Could not create the user'],
        },
      )
    } finally {
      setBusy(false)
    }
  }
  const first = (name) => errors[name]?.[0]
  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Add user"
      description="Creates the account. Leave the password empty to have them set their own through Forgot password."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {first('form') && (
          <p
            role="alert"
            className="rounded-brand bg-c-danger-soft p-3 text-sm text-c-danger"
          >
            {first('form')}
          </p>
        )}
        <Input
          name="email"
          type="email"
          label="Email"
          value={form.email}
          onChange={set('email')}
          error={first('email')}
          required
        />
        <Input
          name="username"
          label="Username"
          value={form.username}
          onChange={set('username')}
          error={first('username')}
          required
        />
        <Input
          name="fullName"
          label="Full name"
          value={form.fullName}
          onChange={set('fullName')}
          error={first('fullName') || first('full_name')}
        />
        <Select
          name="role"
          label="Role"
          value={form.role}
          onChange={set('role')}
          options={ROLES}
          error={first('role')}
        />
        <Input
          name="password"
          type="password"
          label="Password"
          optional
          value={form.password}
          onChange={set('password')}
          error={first('password')}
          autoComplete="new-password"
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            Create user
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default function AdminUsers() {
  const toast = useToast()
  const me = useAuthStore((state) => state.user)
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('')
  const [state, setState] = useState('')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const q = useDebounced(query)
  const { data, status, reload } = useAdminList(admin.adminListUsers, {
    q,
    role,
    status: state,
    page,
  })

  const update = async (person, changes, message) => {
    setBusyId(person.id)
    try {
      await admin.adminUpdateUser(person.id, changes)
      toast.success(message)
      reload()
    } catch (error) {
      toast.error(
        error?.fields?.role?.[0] ||
          error?.fields?.isActive?.[0] ||
          error?.fields?.is_active?.[0] ||
          error?.message ||
          'Could not update the user',
      )
      reload()
    } finally {
      setBusyId(null)
    }
  }
  const filter = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
  }

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage roles and access across the Colearn community."
        actions={
          <Button icon={Plus} onClick={() => setCreating(true)}>
            Add user
          </Button>
        }
      />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <Input
          leftIcon={Search}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(1)
          }}
          placeholder="Search name, username or email..."
          aria-label="Search users"
        />
        <Select
          value={role}
          onChange={filter(setRole)}
          aria-label="Filter by role"
          options={[{ value: '', label: 'All roles' }, ...ROLES]}
          className="sm:w-44"
        />
        <Select
          value={state}
          onChange={filter(setState)}
          aria-label="Filter by status"
          options={[
            { value: '', label: 'Any status' },
            { value: 'active', label: 'Active' },
            { value: 'banned', label: 'Banned' },
          ]}
          className="sm:w-40"
        />
      </div>
      {status === 'error' && <ListError onRetry={reload} />}
      {status === 'loading' ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} height="56px" />
          ))}
        </div>
      ) : data?.items.length ? (
        <>
          <TableShell>
            <THead
              columns={[
                ['User'],
                ['Role'],
                ['XP'],
                ['Joined'],
                ['Status'],
                ['Actions', 'right'],
              ]}
            />
            <tbody>
              {data.items.map((person) => {
                const self = person.id === String(me?.id)
                return (
                  <tr
                    key={person.id}
                    data-user={person.username}
                    className="border-t border-c-border"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={person.avatar}
                          name={person.fullName}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-c-text">
                            {person.fullName}
                            {person.isStaff && (
                              <Badge variant="blue" size="sm" className="ml-2">
                                Staff
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-c-text-muted">
                            @{person.username} · {person.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Select
                        value={person.role}
                        aria-label={`Role for ${person.username}`}
                        disabled={busyId === person.id}
                        onChange={(event) =>
                          update(
                            person,
                            { role: event.target.value },
                            `${person.fullName} is now a ${event.target.value}`,
                          )
                        }
                        options={ROLES}
                        className="h-8 min-w-28"
                      />
                    </td>
                    <td className="px-4 py-4 font-semibold">
                      {person.xp.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-c-text-muted">
                      {formatDay(person.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <Badge
                        variant={person.isActive ? 'success' : 'danger'}
                        dot
                      >
                        {person.isActive ? 'Active' : 'Banned'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        {person.isActive ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={Ban}
                            disabled={self || busyId === person.id}
                            title={self ? 'You cannot ban yourself' : undefined}
                            onClick={() =>
                              setConfirm({
                                title: `Ban ${person.fullName}?`,
                                description:
                                  'They are signed out and cannot log in until you unban them. Their content stays.',
                                confirmLabel: 'Ban user',
                                danger: true,
                                onConfirm: () =>
                                  update(
                                    person,
                                    { isActive: false },
                                    `${person.fullName} was banned`,
                                  ),
                              })
                            }
                          >
                            Ban
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={ShieldCheck}
                            disabled={busyId === person.id}
                            onClick={() =>
                              update(
                                person,
                                { isActive: true },
                                `${person.fullName} can sign in again`,
                              )
                            }
                          >
                            Unban
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Trash2}
                          aria-label={`Delete ${person.username}`}
                          disabled={self}
                          title={
                            self ? 'You cannot delete yourself' : undefined
                          }
                          onClick={() =>
                            setConfirm({
                              title: `Delete ${person.fullName}?`,
                              description:
                                'This permanently deletes the account and everything it owns (threads, comments, progress). It cannot be undone.',
                              confirmLabel: 'Delete permanently',
                              danger: true,
                              onConfirm: async () => {
                                await admin.adminDeleteUser(person.id)
                                toast.success('User deleted')
                                reload()
                              },
                            })
                          }
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </TableShell>
          <Pager data={data} onPage={setPage} />
        </>
      ) : (
        <EmptyState
          title="No users found"
          description="Try a different search, role or status."
        />
      )}
      {creating && (
        <CreateUserModal
          onClose={() => setCreating(false)}
          onCreated={reload}
        />
      )}
      <ConfirmModal request={confirm} onClose={() => setConfirm(null)} />
    </div>
  )
}
