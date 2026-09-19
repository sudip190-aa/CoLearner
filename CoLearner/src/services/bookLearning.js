import { supabase, result, edge } from './supabase/client'

export const bookLearning = {
  position: (chapter) =>
    result(
      supabase
        .from('chapter_progress')
        .select('*')
        .eq('chapter_id', chapter)
        .maybeSingle(),
    ),
  savePosition: (chapter, position, page = null) =>
    result(
      supabase.rpc('colearn_reading_position', {
        chapter,
        read_position: position,
        page,
      }),
    ),
  summaries: (book) =>
    result(supabase.from('book_summaries').select('*').eq('book_id', book)),
  conversations: (book) =>
    result(
      supabase
        .from('book_conversations')
        .select('*')
        .eq('book_id', book)
        .order('created_at', { ascending: false }),
    ),
  messages: (conversation) =>
    result(
      supabase
        .from('book_messages')
        .select('*')
        .eq('conversation_id', conversation)
        .order('id'),
    ),
  deleteConversation: (id) =>
    result(supabase.from('book_conversations').delete().eq('id', id)),
  ask: (bookId, question, chapterId, conversationId) =>
    edge('book-library', {
      action: 'ask',
      bookId,
      question,
      chapterId,
      conversationId,
    }),
  status: (bookId) => edge('book-library', { action: 'status', bookId }),
  file: (bookId, download = false) =>
    edge('book-library', { action: 'file', bookId, download }),
  upload: (bookId, file) => {
    const form = new FormData()
    form.append('action', 'upload')
    form.append('bookId', bookId)
    form.append('file', file)
    return edge('book-library', form)
  },
  queue: (book, kind = 'index') =>
    result(supabase.rpc('colearn_queue_book', { book, job_kind: kind })),
  deleteAi: (book) => result(supabase.rpc('colearn_delete_book_ai', { book })),
  audit: (book) =>
    result(
      supabase
        .from('book_audit')
        .select('*')
        .eq('book_id', book)
        .order('created_at', { ascending: false })
        .limit(30),
    ),
  jobs: (book) =>
    result(
      supabase
        .from('book_jobs')
        .select('*')
        .eq('book_id', book)
        .order('created_at', { ascending: false })
        .limit(8),
    ),
  learning: () =>
    result(
      supabase
        .from('reading_progress')
        .select('*,book:books(id,slug,title,category),chapter:chapters(title)')
        .order('last_read_at', { ascending: false })
        .limit(12),
    ),
}
