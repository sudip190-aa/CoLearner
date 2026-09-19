import React from 'react'
import {
  Check,
  ChevronRight,
  Bookmark,
  MessageSquare,
  GitCommit,
  CheckCircle2,
} from 'lucide-react'
import { Badge, ProgressBar } from '../ui'

/* ── Reader Mock ──────────────────────────────────────────────── */
const ReaderMock = () => (
  <div className="bg-c-surface rounded-2xl shadow-xl border border-c-border overflow-hidden h-[360px] sm:h-[380px] flex">
    {/* Sidebar — collapses on small screens so the reading pane keeps its width */}
    <div className="hidden sm:flex w-52 border-r border-c-border p-4 flex-col gap-2 shrink-0 bg-c-bg-subtle/60">
      <div className="text-xs font-semibold text-c-text-muted uppercase tracking-wider mb-2">
        Contents
      </div>
      {[
        'Intro to Raft',
        'Leader Election',
        'Log Replication',
        'Commit Index',
        'Membership Changes',
      ].map((ch, i) => (
        <div
          key={i}
          className={`flex items-center gap-2 p-2 rounded-lg text-sm cursor-pointer transition-colors ${i === 2 ? 'bg-c-action text-white' : 'text-c-text-muted hover:bg-c-bg'}`}
        >
          {i < 2 ? (
            <CheckCircle2 size={14} className={i < 2 ? 'text-green-500' : ''} />
          ) : (
            <div className="w-3.5 h-3.5 rounded-full border border-current shrink-0" />
          )}
          <span className={i === 2 ? 'font-semibold' : ''}>{ch}</span>
        </div>
      ))}
    </div>
    {/* Content */}
    <div className="flex-1 p-6 overflow-hidden flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Badge variant="blue" size="sm">
          Chapter 3
        </Badge>
        <div className="flex gap-1.5">
          <div className="p-1.5 rounded-md hover:bg-c-bg-subtle text-c-text-muted cursor-pointer">
            <Bookmark size={16} />
          </div>
          <div className="p-1.5 rounded-md hover:bg-c-bg-subtle text-c-text-muted cursor-pointer">
            <MessageSquare size={16} />
          </div>
        </div>
      </div>
      <h4 className="font-bold text-lg text-c-text">Log Replication</h4>
      <div className="space-y-2.5 text-sm text-c-text-muted leading-relaxed flex-1">
        <div className="h-3 bg-c-border/50 rounded w-full" />
        <div className="h-3 bg-c-border/50 rounded w-[90%]" />
        <div className="h-3 bg-c-border/50 rounded w-full" />
        <div className="h-3 bg-c-border/50 rounded w-[75%]" />
        <div className="h-10 bg-c-blue-soft/60 rounded-lg border-l-4 border-c-blue mt-4" />
        <div className="h-3 bg-c-border/50 rounded w-full" />
        <div className="h-3 bg-c-border/50 rounded w-[85%]" />
      </div>
      <ProgressBar value={45} color="blue" className="h-1.5" />
    </div>
  </div>
)

/* ── Workspace Mock ───────────────────────────────────────────── */
const WorkspaceMock = () => (
  <div className="bg-c-surface rounded-2xl shadow-xl border border-c-border overflow-hidden h-[360px] sm:h-[380px] flex flex-col">
    <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-c-border bg-c-bg-subtle/60">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-c-action text-white flex items-center justify-center text-xs font-black shrink-0">
          KV
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-c-text truncate">
            Distributed Key-Value Store
          </div>
          <div className="text-xs text-c-text-muted truncate">
            Rust · 4 members
          </div>
        </div>
      </div>
      <div className="shrink-0">
        <Badge variant="blue" size="sm">
          In Progress
        </Badge>
      </div>
    </div>
    <div className="flex-1 overflow-hidden p-5 flex flex-col gap-3">
      <div className="text-xs font-semibold text-c-text-muted uppercase tracking-wider">
        Sprint Tasks
      </div>
      {[
        { title: 'Implement gRPC transport', done: true, who: 'A' },
        { title: 'Leader election timeout', done: true, who: 'B' },
        { title: 'Log append-entries RPC', done: false, who: 'C' },
        { title: 'Snapshot compaction', done: false, who: 'A' },
      ].map((task, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 p-3 rounded-lg border ${task.done ? 'border-c-success/30 bg-c-success-soft' : 'border-c-border bg-c-surface'}`}
        >
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${task.done ? 'border-green-500 bg-green-500' : 'border-c-border'}`}
          >
            {task.done && (
              <Check size={12} className="text-white" strokeWidth={3} />
            )}
          </div>
          <span
            className={`flex-1 text-sm ${task.done ? 'line-through text-c-text-muted' : 'text-c-text font-medium'}`}
          >
            {task.title}
          </span>
          <div className="w-6 h-6 rounded-full bg-c-blue-soft text-c-blue text-xs font-bold flex items-center justify-center">
            {task.who}
          </div>
        </div>
      ))}
      <div className="mt-auto flex items-center gap-2 pt-1">
        <GitCommit size={14} className="text-c-text-muted" />
        <span className="text-xs text-c-text-muted">23 commits this week</span>
        <div className="flex -space-x-2 ml-auto">
          {['A', 'B', 'C', 'D'].map((l) => (
            <div
              key={l}
              className="w-6 h-6 rounded-full bg-c-blue-soft border-2 border-white text-c-blue text-xs font-bold flex items-center justify-center"
            >
              {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

/* ── Portfolio Mock ───────────────────────────────────────────── */
const PortfolioMock = () => (
  <div className="bg-c-surface rounded-2xl shadow-xl border border-c-border overflow-hidden h-[360px] sm:h-[380px] flex flex-col">
    <div className="px-5 py-4 border-b border-c-border flex items-center gap-3 sm:gap-4 bg-c-bg-subtle/50">
      <div className="w-12 h-12 rounded-full bg-c-action flex items-center justify-center text-white font-bold text-lg shrink-0">
        AM
      </div>
      <div className="min-w-0">
        <div className="font-bold text-c-text truncate">Alex Mercer</div>
        <div className="text-sm text-c-text-muted truncate">
          Full-Stack Builder · Level 4
        </div>
      </div>
      <div className="ml-auto shrink-0">
        <Badge variant="blue" size="sm">
          Open to work
        </Badge>
      </div>
    </div>
    <div className="flex-1 p-5 flex flex-col gap-4 overflow-hidden">
      <div className="grid grid-cols-3 gap-3">
        {[
          ['1,250', 'XP Earned'],
          ['3', 'Projects'],
          ['5', 'Badges'],
        ].map(([val, lbl]) => (
          <div
            key={lbl}
            className="bg-c-bg-subtle rounded-xl p-3 text-center border border-c-border"
          >
            <div className="text-lg font-black text-c-text">{val}</div>
            <div className="text-xs text-c-text-muted">{lbl}</div>
          </div>
        ))}
      </div>
      <div className="text-xs font-semibold text-c-text-muted uppercase tracking-wider">
        Skills
      </div>
      <div className="flex flex-wrap gap-2">
        {['React', 'Rust', 'PostgreSQL', 'Docker', 'gRPC'].map((skill) => (
          <span
            key={skill}
            className="px-3 py-1 bg-c-blue-soft text-c-blue text-xs font-semibold rounded-full border border-c-blue/20"
          >
            {skill}
          </span>
        ))}
      </div>
      <div className="text-xs font-semibold text-c-text-muted uppercase tracking-wider">
        Top Project
      </div>
      <div className="flex items-center gap-3 p-3 bg-c-bg-subtle rounded-xl border border-c-border">
        <div className="w-9 h-9 rounded-lg bg-c-action text-white flex items-center justify-center text-xs font-black shrink-0">
          KV
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-c-text truncate">
            Distributed Key-Value Store
          </div>
          <div className="text-xs text-c-text-muted">
            23 commits · Rust, Networking
          </div>
        </div>
        <ChevronRight size={16} className="text-c-text-muted shrink-0" />
      </div>
    </div>
  </div>
)

/* ── Rows ─────────────────────────────────────────────────────── */
const rows = [
  {
    badge: 'Interactive Reader',
    title: 'Read like a developer, not a student.',
    description:
      'Every chapter links to real code. Highlight, bookmark, and annotate as you go. Track progress per chapter and earn XP for every section completed.',
    mock: <ReaderMock />,
    flip: false,
  },
  {
    badge: 'Project Workspace',
    title: 'Build it with a team. Ship it for real.',
    description:
      'Create or join a project, break work into milestones, assign tasks, and track commits. Your entire project history becomes portfolio evidence.',
    mock: <WorkspaceMock />,
    flip: true,
  },
  {
    badge: 'Portfolio',
    title: 'Your proof lives in public.',
    description:
      'Auto-generated from your activity. Employers see verified commits, real project scope, skills you earned and the team you shipped with.',
    mock: <PortfolioMock />,
    flip: false,
  },
]

export const FeatureShowcase = () => {
  return (
    <section className="py-14 md:py-24 bg-c-surface space-y-16 md:space-y-28">
      {rows.map((row, i) => (
        <div key={i} className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Text */}
            <div className={row.flip ? 'lg:order-2' : ''}>
              <span className="inline-block px-3 py-1 bg-c-blue-soft text-c-blue text-xs font-bold rounded-full uppercase tracking-wider mb-4">
                {row.badge}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-c-text mb-5 leading-tight">
                {row.title}
              </h2>
              <p className="text-lg text-c-text-muted leading-relaxed max-w-lg">
                {row.description}
              </p>
            </div>
            {/* Visual Mock */}
            <div className={row.flip ? 'lg:order-1' : ''}>{row.mock}</div>
          </div>
        </div>
      ))}
    </section>
  )
}
