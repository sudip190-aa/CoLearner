import { users } from './users.js'

const weeklyXp = {
  usr_001: 620,
  usr_002: 880,
  usr_003: 540,
  usr_004: 760,
  usr_005: 410,
  usr_006: 330,
  usr_007: 690,
  usr_008: 280,
  usr_009: 470,
  usr_010: 520,
  usr_011: 805,
  usr_012: 190,
  usr_013: 610,
  usr_014: 930,
}

const rank = (items, scoreKey) =>
  items
    .map((user) => ({ user, score: user[scoreKey] }))
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({
      rank: index + 1,
      user: entry.user,
      xp: entry.score,
    }))

export const allTime = rank(users, 'xp')
export const weekly = users
  .map((user) => ({ ...user, weeklyXp: weeklyXp[user.id] || 0 }))
  .sort((a, b) => b.weeklyXp - a.weeklyXp)
  .map((user, index) => ({ rank: index + 1, user, xp: user.weeklyXp }))

export const leaderboard = { weekly, allTime }
export default leaderboard
