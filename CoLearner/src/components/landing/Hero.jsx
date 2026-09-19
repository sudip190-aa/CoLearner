import React from 'react'
import { Button, Logo, ProgressBar, Card, Chip } from '../ui'
import { Flame, FolderOpen, ArrowRight } from 'lucide-react'

export const Hero = () => {
  return (
    <section className="pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden relative bg-c-surface">
      <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: Content */}
        <div className="max-w-2xl relative z-10">
          <h1 className="text-[2rem] leading-[2.5rem] sm:text-5xl sm:leading-[3.5rem] font-extrabold text-c-text tracking-tight mb-6">
            Learn it.
            <br />
            Build it.
            <br />
            <span className="relative inline-block">
              <span className="relative z-10">Prove it.</span>
              {/* Hand-drawn style highlight */}
              <svg
                className="absolute left-0 bottom-1 w-full h-4 -z-10 text-c-yellow"
                viewBox="0 0 200 20"
                preserveAspectRatio="none"
              >
                <path
                  d="M 0 10 Q 50 0, 100 10 T 200 10"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="none"
                  style={{ transform: 'rotate(-2deg)' }}
                />
              </svg>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-c-text-muted mb-8 leading-relaxed max-w-lg">
            Connect with learners, builders, and mentors so you finish what you
            start and have something real to show for it.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="text-lg px-8">
              Start building free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Explore projects
            </Button>
          </div>
        </div>

        {/* Right: Dashboard Mock */}
        <div className="relative z-10 lg:ml-auto w-full max-w-lg bg-c-bg rounded-2xl border border-c-border shadow-xl overflow-hidden flex h-[420px] lg:h-[480px]">
          {/* Mock Sidebar */}
          <div className="w-16 bg-c-bg border-r border-c-border flex flex-col items-center py-4 gap-6 shrink-0">
            <Logo variant="mark" size="xs" />
            <div className="w-8 h-8 rounded-md bg-c-blue-soft text-c-blue flex items-center justify-center">
              <FolderOpen size={18} />
            </div>
            <div className="w-8 h-8 rounded-md hover:bg-c-bg-subtle text-c-text-muted flex items-center justify-center">
              <span className="w-4 h-4 bg-c-border rounded-full" />
            </div>
            <div className="w-8 h-8 rounded-md hover:bg-c-bg-subtle text-c-text-muted flex items-center justify-center">
              <span className="w-4 h-4 bg-c-border rounded-full" />
            </div>
          </div>

          {/* Mock Main Content */}
          <div className="min-w-0 flex-1 p-6 flex flex-col gap-6 overflow-hidden bg-c-bg-subtle/50">
            {/* Top Bar Mock */}
            <div className="flex justify-between items-center">
              <div className="w-24 sm:w-32 h-6 bg-c-border/50 rounded animate-pulse" />
              <div className="flex items-center gap-3">
                <Chip
                  variant="yellow"
                  className="hidden sm:inline-flex font-semibold shadow-sm"
                >
                  <Flame size={14} className="mr-1" />5 Day Streak
                </Chip>
                <div className="w-8 h-8 rounded-full bg-c-blue-soft border border-c-blue/20" />
              </div>
            </div>

            {/* XP Bar Mock */}
            <Card className="min-w-0 shadow-sm border-0 ring-1 ring-c-border">
              <div className="p-4">
                <div className="flex justify-between mb-2 text-sm font-medium">
                  <span>Level 4 Builder</span>
                  <span className="text-c-blue">1,250 XP</span>
                </div>
                <ProgressBar value={65} color="yellow" className="h-2.5" />
              </div>
            </Card>

            {/* Project Cards Mock */}
            <div className="grid gap-4 flex-1">
              <Card className="min-w-0 shadow-sm border-0 ring-1 ring-c-border hover:ring-c-blue transition-all">
                <div className="p-4 flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-c-action text-white flex items-center justify-center shrink-0">
                    <span className="font-bold">KV</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate font-semibold text-c-text mb-1">
                      Distributed Key-Value Store
                    </h4>
                    <p className="truncate text-sm text-c-text-muted">
                      Rust • Raft Consensus • Networking
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="min-w-0 shadow-sm border-0 ring-1 ring-c-border hover:ring-c-blue transition-all opacity-80">
                <div className="p-4 flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-c-bg-subtle text-c-text-muted flex items-center justify-center shrink-0 border border-dashed border-c-border">
                    <span className="text-xl">+</span>
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <h4 className="font-medium text-c-text mb-0.5">
                      Start new project
                    </h4>
                    <p className="text-sm text-c-text-muted">
                      Choose a real-world clone
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-64 h-64 bg-c-blue/10 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-64 h-64 bg-c-yellow/10 blur-3xl rounded-full pointer-events-none" />
        </div>
      </div>
    </section>
  )
}
