import React from 'react'
import { Flame, Zap, Trophy, Star, Medal, Award } from 'lucide-react'
import { ProgressBar } from '../ui'

const leaderboard = [
  { rank: 1, name: 'Sarah Connor', xp: 5000, progress: 100, badge: '🥇' },
  { rank: 2, name: 'Alex Mercer', xp: 1250, progress: 25, badge: '🥈' },
  { rank: 3, name: 'Jordan Lee', xp: 980, progress: 20, badge: '🥉' },
]

const badges = [
  { icon: Star, label: 'First Commit', color: 'bg-c-yellow' },
  { icon: Flame, label: '7-Day Streak', color: 'bg-orange-400' },
  { icon: Trophy, label: 'MVP Builder', color: 'bg-c-blue' },
  { icon: Medal, label: 'Peer Mentor', color: 'bg-purple-500' },
  { icon: Award, label: 'Top Learner', color: 'bg-green-500' },
]

export const GamificationBand = () => {
  return (
    <section className="bg-c-blue-wash py-14 md:py-24">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-c-text mb-4">
            Make progress you can feel.
          </h2>
          <p className="text-lg text-c-text-muted max-w-xl mx-auto">
            XP, streaks, badges, and a leaderboard that keeps you honest and
            your team motivated.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start max-w-6xl mx-auto">
          {/* XP + Streak Stats */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-c-text-muted">
              Your Progress
            </h3>

            <div className="bg-white rounded-2xl border border-c-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-c-yellow flex items-center justify-center">
                  <Zap size={22} className="text-c-text" fill="currentColor" />
                </div>
                <div>
                  <div className="text-2xl font-black text-c-text">1,250</div>
                  <div className="text-xs text-c-text-muted font-medium">
                    Experience Points
                  </div>
                </div>
              </div>
              <div className="flex justify-between mb-2 text-sm font-medium text-c-text">
                <span>Level 4 → Level 5</span>
                <span className="text-c-blue">65%</span>
              </div>
              <ProgressBar value={65} color="yellow" />
              <p className="text-xs text-c-text-muted mt-2">
                250 XP to next level
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-c-border p-6 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center">
                <Flame size={30} className="text-orange-500" />
              </div>
              <div>
                <div className="text-3xl font-black text-c-text">5</div>
                <div className="text-sm text-c-text-muted">Day Streak 🔥</div>
                <div className="text-xs text-c-text-muted mt-0.5">
                  Best: 14 days
                </div>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-c-text-muted">
              Badges Earned
            </h3>
            <div className="bg-white rounded-2xl border border-c-border p-6 shadow-sm">
              <div className="grid grid-cols-3 gap-4">
                {badges.map((b) => {
                  const Icon = b.icon
                  return (
                    <div
                      key={b.label}
                      className="flex flex-col items-center gap-2"
                    >
                      <div
                        className={`w-14 h-14 rounded-2xl ${b.color} flex items-center justify-center shadow-sm`}
                      >
                        <Icon size={26} className="text-white" />
                      </div>
                      <span className="text-xs text-c-text-muted text-center leading-tight">
                        {b.label}
                      </span>
                    </div>
                  )
                })}
                <div className="flex flex-col items-center gap-2 opacity-40">
                  <div className="w-14 h-14 rounded-2xl bg-c-border border-2 border-dashed border-c-border flex items-center justify-center">
                    <span className="text-2xl text-c-text-muted">?</span>
                  </div>
                  <span className="text-xs text-c-text-muted text-center">
                    Locked
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-c-text-muted">
              Leaderboard
            </h3>
            <div className="bg-white rounded-2xl border border-c-border overflow-hidden shadow-sm">
              {leaderboard.map((entry, i) => (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-4 p-4 ${i < leaderboard.length - 1 ? 'border-b border-c-border' : ''} ${i === 1 ? 'bg-c-blue-soft/30' : ''}`}
                >
                  <span className="text-xl w-6 text-center">{entry.badge}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1.5">
                      <span
                        className={`text-sm font-semibold text-c-text ${i === 1 ? 'text-c-blue' : ''}`}
                      >
                        {entry.name}
                      </span>
                      <span className="text-xs font-bold text-c-blue">
                        {entry.xp.toLocaleString()} XP
                      </span>
                    </div>
                    <ProgressBar
                      value={entry.progress}
                      color="yellow"
                      className="h-1.5"
                    />
                  </div>
                </div>
              ))}
              <div className="px-4 py-3 bg-c-bg-subtle/50 text-center">
                <span className="text-xs text-c-blue font-semibold cursor-pointer hover:underline">
                  View full leaderboard →
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
