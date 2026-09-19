import { users } from './users.js'

export const currentUser = {
  ...users[0],
  fullName: 'Maya Chen',
  role: 'learner',
  xp: 4380,
  level: 10,
  streakDays: 12,
}

export default currentUser
