// One-time transition for accounts created before email confirmation was disabled.
// Uses the Auth Admin API; never changes passwords, bans, or application privileges.
import { createClient } from '../../CoLearner/node_modules/@supabase/supabase-js/dist/index.mjs'
import { execFileSync } from 'node:child_process'

const ref = 'ghjdpcvnzclfvyosfhoz'
const url = `https://${ref}.supabase.co`
const raw = JSON.parse(execFileSync('supabase.cmd', ['projects', 'api-keys', '--project-ref', ref, '--reveal', '--output', 'json'], { shell: true, encoding: 'utf8' }))
const keys = Array.isArray(raw) ? raw : raw.api_keys || raw.keys
const publicKey = keys.find(k => k.name === 'anon').api_key
const response = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: publicKey } })
if (!response.ok || !(await response.json()).mailer_autoconfirm) throw new Error('Email auto-confirmation must be enabled before running this transition.')
const admin = createClient(url, keys.find(k => k.name === 'service_role').api_key, { auth: { persistSession: false, autoRefreshToken: false } })
const pending = []
for (let page = 1; ; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
  if (error) throw new Error(error.message)
  pending.push(...data.users.filter(u => u.email && !u.email_confirmed_at && !u.invited_at && (u.app_metadata.provider === 'email' || u.app_metadata.providers?.includes('email'))))
  if (data.users.length < 1000) break
}
if (!process.argv.includes('--apply')) {
  console.log(`${pending.length} existing email signup(s) are awaiting confirmation. Use --apply to complete the transition.`)
} else {
  for (const user of pending) {
    const { error } = await admin.auth.admin.updateUserById(user.id, { email_confirm: true })
    if (error) throw new Error(error.message)
  }
  console.log(`Confirmed ${pending.length} existing email signup(s); passwords and permissions were preserved.`)
}
