// Turns a notification from the API into a sentence and a link. The verbs are the ones the backend creates.
const project = (n) =>
  n.target?.slug ? `/projects/${n.target.slug}` : '/projects'
const workspace = (n) =>
  n.target?.slug ? `/projects/${n.target.slug}/workspace` : '/projects'
const thread = (n) =>
  n.target?.slug
    ? `/community/${n.target.slug}${n.targetAnchor ? `#${n.targetAnchor}` : ''}`
    : '/community'
const person = (n) => (n.actor?.username ? `/u/${n.actor.username}` : '/people')

// phrase: text that follows the actor's name; `label` (the target's title) is appended when there is one.
const VERBS = {
  project_call: {
    phrase: 'started a team voice call in',
    to: (n) =>
      n.target?.slug ? `/projects/${n.target.slug}/chat` : '/projects',
  },
  project_message: {
    phrase: 'messaged your project',
    to: (n) =>
      n.target?.slug ? `/projects/${n.target.slug}/chat` : '/projects',
  },
  direct_message: {
    phrase: 'sent you a message',
    to: (n) => `/messages?to=${encodeURIComponent(n.target?.slug || '')}`,
  },
  voice_call: {
    phrase: 'called you',
    to: (n) => `/messages?to=${encodeURIComponent(n.target?.slug || '')}`,
  },
  comment: { phrase: 'commented in', to: thread },
  join_request: { phrase: 'asked to join', to: workspace },
  join_approved: { phrase: 'accepted your request to join', to: project },
  commented_on_thread: { phrase: 'commented on your thread', to: thread },
  replied_to_comment: { phrase: 'replied to your comment in', to: thread },
  mentioned_you: { phrase: 'mentioned you in', to: thread },
  connection_request: { phrase: 'sent you a connection request', to: person },
  connection_accepted: {
    phrase: 'accepted your connection request',
    to: person,
  },
  project_join_request: { phrase: 'asked to join', to: workspace },
  project_join_approved: {
    phrase: 'accepted your request to join',
    to: project,
  },
  project_join_rejected: {
    phrase: 'declined your request to join',
    to: project,
  },
  project_invite: { phrase: 'invited you to join', to: project },
  project_invite_accepted: {
    phrase: 'accepted your invitation to',
    to: workspace,
  },
  project_invite_declined: {
    phrase: 'declined your invitation to',
    to: project,
  },
  project_removed: { phrase: 'removed you from', to: () => '/projects' },
  project_member_left: { phrase: 'left', to: workspace },
  project_update: { phrase: 'posted an update in', to: workspace },
  task_assigned: { phrase: 'assigned you a task in', to: workspace },
}

export function describeNotification(notification) {
  const { verb } = notification
  if (verb === 'level_up') {
    return {
      actorName: '',
      phrase: 'You reached a new level. Keep going!',
      label: '',
      to: '/leaderboard',
    }
  }
  if (verb.startsWith('badge_')) {
    return {
      actorName: '',
      phrase: 'You earned the',
      label: notification.target?.label
        ? `${notification.target.label} badge`
        : 'a new badge',
      to: '/badges',
    }
  }
  const known = VERBS[verb]
  return {
    actorName: notification.actor?.fullName || '',
    phrase: known?.phrase || 'has new activity for you',
    label: notification.target?.label || '',
    to: known ? known.to(notification) : '/notifications',
  }
}

export const isMention = (notification) => notification.verb === 'mentioned_you'
