import { supabase, result, viewerId } from './supabase/client'

async function requireUser() {
  const id = await viewerId()
  if (!id) throw new Error('Please sign in to save your learning preferences.')
  return id
}

export const libraryPreferences = {
  async get() {
    const userId = await requireUser()
    const preferences = await result(
      supabase
        .from('library_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
    )
    const savedIds = []
    for (let offset = 0; ; offset += 500) {
      const batch = await result(
        supabase
          .from('saved_books')
          .select('book_id')
          .eq('user_id', userId)
          .order('book_id')
          .range(offset, offset + 499),
      )
      savedIds.push(...batch.map((row) => String(row.book_id)))
      if (batch.length < 500) break
    }
    return { preferences, savedIds }
  },
  async save(preferences) {
    const user_id = await requireUser()
    const { goal, topics, level, session_minutes } = preferences
    return result(
      supabase
        .from('library_preferences')
        .upsert({ user_id, goal, topics, level, session_minutes })
        .select()
        .single(),
    )
  },
  async setSaved(bookId, saved) {
    const user_id = await requireUser()
    if (saved)
      await result(
        supabase
          .from('saved_books')
          .upsert(
            { user_id, book_id: bookId },
            { onConflict: 'user_id,book_id', ignoreDuplicates: true },
          ),
      )
    else
      await result(
        supabase
          .from('saved_books')
          .delete()
          .eq('user_id', user_id)
          .eq('book_id', bookId),
      )
  },
}
