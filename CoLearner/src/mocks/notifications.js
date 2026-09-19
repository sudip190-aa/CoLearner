import { users } from './users.js'

const [maya, jordan, priya, samuel, elena, lena] = users

export const notifications = [
  {
    id: 'notification_001',
    actor: jordan,
    verb: 'commented on your project',
    target: 'Pulseboard',
    isRead: false,
    createdAt: '2026-09-18T09:15:00Z',
  },
  {
    id: 'notification_002',
    actor: priya,
    verb: 'sent you a peer review',
    target: 'Designing for Focus',
    isRead: false,
    createdAt: '2026-09-18T08:42:00Z',
  },
  {
    id: 'notification_003',
    actor: elena,
    verb: 'joined your project',
    target: 'Open Path',
    isRead: false,
    createdAt: '2026-09-17T18:30:00Z',
  },
  {
    id: 'notification_004',
    actor: samuel,
    verb: 'mentioned you in a discussion',
    target: 'How are you structuring Terraform modules?',
    isRead: true,
    createdAt: '2026-09-17T14:05:00Z',
  },
  {
    id: 'notification_005',
    actor: lena,
    verb: 'upvoted your comment',
    target: 'The best first test is the one you can explain',
    isRead: true,
    createdAt: '2026-09-17T11:22:00Z',
  },
  {
    id: 'notification_006',
    actor: jordan,
    verb: 'completed a milestone in',
    target: 'Civic Signals',
    isRead: true,
    createdAt: '2026-09-16T16:18:00Z',
  },
  {
    id: 'notification_007',
    actor: priya,
    verb: 'started following you',
    target: 'Maya Chen',
    isRead: true,
    createdAt: '2026-09-16T10:45:00Z',
  },
  {
    id: 'notification_008',
    actor: elena,
    verb: 'shared a book recommendation',
    target: 'The Little Book of Semaphores',
    isRead: true,
    createdAt: '2026-09-15T19:10:00Z',
  },
  {
    id: 'notification_009',
    actor: samuel,
    verb: 'completed a task in',
    target: 'Open Path',
    isRead: true,
    createdAt: '2026-09-15T13:36:00Z',
  },
  {
    id: 'notification_010',
    actor: lena,
    verb: 'replied to your thread',
    target: 'What makes a project brief useful?',
    isRead: true,
    createdAt: '2026-09-14T17:00:00Z',
  },
  {
    id: 'notification_011',
    actor: jordan,
    verb: 'earned a badge',
    target: 'Systems Thinker',
    isRead: true,
    createdAt: '2026-09-14T09:24:00Z',
  },
  {
    id: 'notification_012',
    actor: maya,
    verb: 'reached a new level',
    target: 'Level 10',
    isRead: true,
    createdAt: '2026-09-13T20:12:00Z',
  },
]

export default notifications
