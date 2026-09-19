import { createContext, useContext, useEffect, useState } from 'react'
import { Mic, MicOff, Phone, PhoneOff, Volume2, X } from 'lucide-react'
import { Avatar, Button, Modal } from '../ui'
import { useAuthStore } from '../../store/authStore'
import { VoiceCalls } from '../../services/voiceCalls'

const VoiceContext = createContext(null)
export const useVoiceCall = () => useContext(VoiceContext)
const phases = {
  calling: 'Calling…',
  ringing: 'Ringing…',
  connecting: 'Connecting…',
  connected: 'Connected',
  reconnecting: 'Reconnecting…',
}

function Duration({ since }) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    const tick = () =>
      setSeconds(Math.max(0, Math.floor((Date.now() - since) / 1000)))
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [since])
  return (
    <span className="tabular-nums">
      {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
    </span>
  )
}

export function VoiceCallProvider({ children }) {
  const me = useAuthStore((state) => state.user?.id)
  const [controller, setController] = useState(null)
  const [state, setState] = useState({ phase: 'idle' })
  useEffect(() => {
    if (!me) return
    const instance = new VoiceCalls(me, setState)
    // Lifecycle ownership stays outside render; teardown closes every media resource.
    void instance.start().then(() => {
      if (!instance.disposed) {
        setController(instance)
        setState(instance.state)
      }
    })
    return () => instance.dispose()
  }, [me])
  const active = me && controller?.me === me && !controller.disposed
  const busy = active && !['idle', 'finished'].includes(state.phase)
  const name =
    state.person?.full_name || state.person?.username || 'Your connection'
  return (
    <VoiceContext.Provider
      value={{
        call: (person) => active && controller.call(person),
        busy,
        available: !!active,
      }}
    >
      {children}
      {active && (
        <>
          <Modal
            isOpen={state.phase === 'incoming'}
            onClose={() => controller.finish('Call declined', 'decline')}
            title="Incoming voice call"
            description="A connection would like to talk with you."
            size="sm"
          >
            <div className="flex flex-col items-center py-4 text-center">
              <div className="rounded-full bg-c-blue-wash p-3">
                <Avatar
                  key={state.person?.id}
                  size="xl"
                  name={name}
                  src={state.person?.avatar}
                />
              </div>
              <p className="mt-4 text-xl font-semibold">{name}</p>
              <p className="mt-1 text-sm text-c-text-muted">
                Connected on CoLearn
              </p>
              <div className="mt-7 flex w-full gap-3">
                <Button
                  className="flex-1"
                  variant="secondary"
                  icon={PhoneOff}
                  onClick={() => controller.finish('Call declined', 'decline')}
                >
                  Decline
                </Button>
                <Button
                  className="flex-1"
                  icon={Phone}
                  onClick={() => void controller.accept()}
                >
                  Accept
                </Button>
              </div>
            </div>
          </Modal>
          {busy && state.phase !== 'incoming' && (
            <section
              aria-label="Voice call"
              className="fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-3xl border border-c-blue/20 bg-c-surface p-5 shadow-xl sm:bottom-6 sm:right-6"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  key={state.person?.id}
                  name={name}
                  src={state.person?.avatar}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-semibold">{name}</h2>
                  <p role="status" className="mt-1 text-xs text-c-text-muted">
                    {phases[state.phase]}
                    {state.connectedAt && (
                      <>
                        {' '}
                        · <Duration since={state.connectedAt} />
                      </>
                    )}
                  </p>
                </div>
                <span className="rounded-full bg-c-blue-soft p-2 text-c-blue">
                  <Phone size={16} />
                </span>
              </div>
              {state.audioBlocked && (
                <button
                  onClick={() => void controller.playAudio()}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-c-yellow-soft p-3 text-sm font-medium"
                >
                  <Volume2 size={16} />
                  Enable call audio
                </button>
              )}
              <div className="mt-5 flex gap-3">
                <Button
                  className="flex-1"
                  variant="secondary"
                  icon={state.muted ? MicOff : Mic}
                  aria-pressed={state.muted}
                  disabled={
                    !['connected', 'reconnecting'].includes(state.phase)
                  }
                  onClick={() => controller.mute()}
                >
                  {state.muted ? 'Unmute' : 'Mute'}
                </Button>
                <button
                  onClick={() => controller.finish('Call ended', 'end')}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                >
                  <PhoneOff size={18} />
                  End call
                </button>
              </div>
              <p className="mt-3 text-center text-[11px] text-c-text-muted">
                {state.muted
                  ? 'Your microphone is muted'
                  : 'Voice only · No recording'}
              </p>
            </section>
          )}
          {state.phase === 'finished' && (
            <div
              role="status"
              className="fixed bottom-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-2xl border border-c-border bg-c-surface p-4 shadow-lg"
            >
              <PhoneOff
                size={18}
                className="mt-0.5 shrink-0 text-c-text-muted"
              />
              <p className="flex-1 text-sm leading-6">{state.message}</p>
              <button
                aria-label="Dismiss call status"
                className="rounded-lg p-1 hover:bg-c-blue-wash"
                onClick={() => controller.emit({ phase: 'idle' })}
              >
                <X size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </VoiceContext.Provider>
  )
}
