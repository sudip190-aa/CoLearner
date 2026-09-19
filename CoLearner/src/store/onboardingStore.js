import { create } from 'zustand'

const initialDraft = {
  path: 'learner',
  skills: [],
  interests: [],
  profile: {
    headline: '',
    bio: '',
    location: '',
    github: '',
    linkedin: '',
    website: '',
    avatar: '',
  },
}

export const useOnboardingStore = create((set) => ({
  step: 0,
  draft: initialDraft,
  setStep: (step) => set({ step }),
  updateDraft: (updates) =>
    set((state) => ({ draft: { ...state.draft, ...updates } })),
  updateProfile: (profile) =>
    set((state) => ({
      draft: {
        ...state.draft,
        profile: { ...state.draft.profile, ...profile },
      },
    })),
  reset: () => set({ step: 0, draft: initialDraft }),
}))

export default useOnboardingStore
