import React from 'react'
import {
  BookOpen,
  Check,
  Flame,
  FolderKanban,
  LayoutDashboard,
  MessageCircle,
  Users,
} from 'lucide-react'

const taskColumns = [
  {
    title: 'To do',
    dot: 'bg-slate-400',
    tasks: [
      ['Add book search', 'Feature · Maya'],
      ['Write setup guide', 'Docs · Sam'],
    ],
  },
  {
    title: 'In progress',
    dot: 'bg-c-blue',
    tasks: [['Build reading list', 'Feature · Alex']],
  },
  {
    title: 'Review',
    dot: 'bg-amber-500',
    tasks: [['Create book cards', 'UI · Maya']],
  },
]

export const ProductPreview = ({ variant }) => (
  <figure className="min-w-0">
    <div className="overflow-hidden rounded-2xl border border-c-border bg-white shadow-xl shadow-blue-900/5">
      <div className="flex items-center justify-between gap-3 border-b border-c-border px-5 py-3">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          <span className="h-2 w-2 rounded-full bg-slate-300" />
        </div>
        <span className="text-[11px] font-medium text-c-text-muted">
          CoLearn /{' '}
          {variant === 'dashboard' ? 'Dashboard' : 'Project workspace'}
        </span>
        <span
          className="h-5 w-5 rounded-full bg-c-blue-soft"
          aria-hidden="true"
        />
      </div>
      {variant === 'dashboard' ? (
        <div className="flex">
          <div
            className="hidden w-12 shrink-0 flex-col items-center gap-6 border-r border-c-border py-6 text-slate-400 sm:flex"
            aria-hidden="true"
          >
            <LayoutDashboard size={18} className="text-c-blue" />
            <BookOpen size={18} />
            <FolderKanban size={18} />
            <Users size={18} />
            <MessageCircle size={18} />
          </div>
          <div className="min-w-0 flex-1 bg-slate-50/70 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-c-text-muted">Your learning space</p>
              <span className="flex items-center gap-1 rounded-full bg-c-yellow-soft px-2 py-1 text-[10px] font-semibold">
                <Flame size={12} />
                5-day streak
              </span>
            </div>
            <h2 className="mt-2 text-xl font-bold">Keep going, Alex.</h2>
            <p className="mt-1 text-xs text-c-text-muted">
              One chapter closer. One task further.
            </p>
            <div className="my-5 grid grid-cols-3 gap-2">
              {[
                ['3', 'Books in progress'],
                ['2', 'Active projects'],
                ['4', 'Badges earned'],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-xl border border-c-border bg-white p-3"
                >
                  <p className="text-xl font-bold">{value}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-c-text-muted">
                    {label}
                  </p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-c-border bg-white p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-c-text-muted">
                Continue learning
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded bg-c-blue text-white">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">
                    JavaScript fundamentals
                  </h3>
                  <p className="mt-1 text-xs text-c-text-muted">
                    Next up: Functions & scope
                  </p>
                </div>
              </div>
              <div className="mb-2 mt-4 flex justify-between text-[10px] text-c-text-muted">
                <span>6 of 10 chapters</span>
                <span>60%</span>
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full bg-c-blue-soft"
                role="progressbar"
                aria-label="Example reading progress"
                aria-valuenow={60}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="h-full w-3/5 rounded-full bg-c-blue" />
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-c-border bg-white p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-c-text-muted">
                Your next task
              </p>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-slate-300" />
                <div>
                  <p className="text-sm font-semibold">
                    Build the reading list view
                  </p>
                  <p className="mt-1 text-xs text-c-text-muted">
                    BookShelf · In progress
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-c-blue-soft p-3 text-c-blue">
              <FolderKanban size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">BookShelf</h3>
              <p className="mt-1 text-xs text-c-text-muted">
                A shared reading tracker for curious people.
              </p>
            </div>
          </div>
          <div className="my-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {['React', 'Django'].map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-c-text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
            <span className="flex items-center gap-1.5 text-xs text-c-text-muted">
              <Users size={14} />3 collaborators
            </span>
          </div>
          <div className="mb-5 rounded-lg border border-c-border p-3">
            <div className="flex justify-between gap-3 text-xs">
              <span className="font-semibold">
                Milestone: First working prototype
              </span>
              <span className="shrink-0 text-c-blue">3 / 7 tasks</span>
            </div>
            <div
              className="mt-3 h-1.5 rounded-full bg-c-blue-soft"
              role="progressbar"
              aria-label="Example milestone progress"
              aria-valuenow={3}
              aria-valuemin={0}
              aria-valuemax={7}
            >
              <div className="h-full w-[43%] rounded-full bg-c-blue" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {taskColumns.map((column) => (
              <div key={column.title} className="rounded-xl bg-slate-50 p-3">
                <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold">
                  <span className={`h-1.5 w-1.5 rounded-full ${column.dot}`} />
                  {column.title}
                  <span className="ml-auto text-slate-400">
                    {column.tasks.length}
                  </span>
                </p>
                <div className="space-y-2">
                  {column.tasks.map(([task, owner]) => (
                    <div
                      key={task}
                      className="rounded-lg border border-c-border bg-white p-3"
                    >
                      <p className="text-xs font-medium leading-relaxed">
                        {task}
                      </p>
                      <p className="mt-4 text-[10px] text-c-text-muted">
                        {owner}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs text-c-text-muted">
            <Check size={15} className="text-green-700" />
            Latest update: Project setup completed
          </div>
        </div>
      )}
    </div>
    <figcaption className="mt-4 text-center text-xs text-c-text-muted">
      {variant === 'dashboard' ? 'Dashboard' : 'Project workspace'} preview ·
      Illustrative example data
    </figcaption>
  </figure>
)
