import React, { useEffect, useState } from 'react'
import { Send, Plus, Trash2 } from 'lucide-react'
import { Button, Select, Textarea } from '../ui'
import { bookLearning } from '../../services/bookLearning'

export function BookAssistant({ book, chapter, onCitation }) {
  const [status, setStatus] = useState(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false)
  const [conversations, setConversations] = useState([]),
    [conversation, setConversation] = useState(''),
    [messages, setMessages] = useState([])
  const [question, setQuestion] = useState(''),
    [summaries, setSummaries] = useState([]),
    [tab, setTab] = useState('ask')
  useEffect(() => {
    let active = true
    Promise.all([
      bookLearning.status(book.id),
      bookLearning.conversations(book.id),
      bookLearning.summaries(book.id),
    ])
      .then(([s, c, r]) => {
        if (active) {
          setStatus(s)
          setConversations(c)
          setSummaries(r)
          setConversation(c[0]?.id || '')
        }
      })
      .catch((e) => {
        if (active) setError(e.message)
      })
    return () => {
      active = false
    }
  }, [book.id])
  useEffect(() => {
    let active = true
    if (!conversation) return
    bookLearning
      .messages(conversation)
      .then((r) => {
        if (active) setMessages(r)
      })
      .catch((e) => {
        if (active) setError(e.message)
      })
    return () => {
      active = false
    }
  }, [conversation])
  async function send(event) {
    event.preventDefault()
    if (busy || !question.trim()) return
    setBusy(true)
    setError('')
    const text = question.trim()
    try {
      const answer = await bookLearning.ask(
        book.id,
        text,
        chapter?.id,
        conversation || null,
      )
      setConversation(answer.conversationId)
      setMessages(await bookLearning.messages(answer.conversationId))
      setConversations(await bookLearning.conversations(book.id))
      setQuestion('')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  async function clear() {
    try {
      await bookLearning.deleteConversation(conversation)
      setConversations((c) => c.filter((x) => x.id !== conversation))
      setConversation('')
      setMessages([])
    } catch (e) {
      setError(e.message)
    }
  }
  const citations = (items) => (
    <div className="mt-3 flex flex-wrap gap-2">
      {(items || []).map((c, i) => (
        <button
          key={i}
          type="button"
          className="rounded-full border border-c-blue/20 bg-white px-3 py-1 text-xs font-medium text-c-blue hover:bg-c-blue-soft"
          onClick={() => onCitation(c)}
        >
          {c.pageStart
            ? `Page ${c.pageStart}${c.pageEnd > c.pageStart ? `–${c.pageEnd}` : ''}`
            : book.chapters.find((x) => String(x.id) === String(c.chapterId))
                ?.title || 'Book excerpt'}
        </button>
      ))}
    </div>
  )
  return (
    <div className="flex min-h-0 flex-col gap-4">
      <p className="text-xs text-c-text-muted">
        Reading {chapter?.title || book.title}
      </p>
      <div className="flex gap-2 border-b border-c-border pb-3">
        {[
          ['ask', 'Ask this book'],
          ['summary', 'Learning summaries'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-full px-3 py-2 text-sm font-medium ${tab === key ? 'bg-c-blue-soft text-c-blue' : 'text-c-text-muted'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'summary' ? (
        <div className="max-h-[55vh] space-y-5 overflow-y-auto">
          {!summaries.length ? (
            <p className="py-8 text-sm text-c-text-muted">
              Summaries will appear here once an administrator generates them.
            </p>
          ) : (
            summaries
              .filter(
                (s) =>
                  !s.chapter_id || String(s.chapter_id) === String(chapter?.id),
              )
              .map((s) => (
                <article key={s.id}>
                  <h3 className="font-semibold">
                    {s.chapter_id ? 'This chapter' : 'Book overview'}
                  </h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
                    {s.content.answer}
                  </p>
                  {citations(s.content.citations)}
                </article>
              ))
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Select
              aria-label="Conversation"
              value={conversation}
              disabled={busy}
              onChange={(e) => {
                setMessages([])
                setConversation(e.target.value)
              }}
              options={[
                { value: '', label: 'New conversation' },
                ...conversations.map((c) => ({ value: c.id, label: c.title })),
              ]}
              className="min-w-0 flex-1"
            />
            <Button
              aria-label="New conversation"
              variant="ghost"
              icon={Plus}
              disabled={busy}
              onClick={() => {
                setConversation('')
                setMessages([])
                setError('')
              }}
            />
            {conversation && (
              <Button
                aria-label="Delete conversation"
                variant="ghost"
                icon={Trash2}
                disabled={busy}
                onClick={clear}
              />
            )}
          </div>
          <div
            className="max-h-[42vh] min-h-32 space-y-4 overflow-y-auto pr-1"
            role="log"
            aria-live="polite"
          >
            {messages.length ? (
              messages.map((m) => (
                <article
                  key={m.id}
                  className={`rounded-2xl p-4 ${m.role === 'user' ? 'ml-8 bg-c-blue-soft' : 'mr-2 bg-slate-50'}`}
                >
                  <p className="mb-2 text-xs font-semibold text-c-text-muted">
                    {m.role === 'user' ? 'You' : 'Book assistant'}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-6">
                    {m.content}
                  </p>
                  {citations(m.citations)}
                </article>
              ))
            ) : (
              <div className="py-5">
                <h3 className="font-semibold">
                  A little help with this chapter.
                </h3>
                <p className="mt-2 text-sm leading-6 text-c-text-muted">
                  Ask for an explanation, compare ideas, or try a practice
                  question. Answers use this book and link back to its evidence.
                </p>
              </div>
            )}
            {busy && (
              <p className="text-sm text-c-text-muted">
                Finding evidence in this book…
              </p>
            )}
          </div>
          {status && !status.configured ? (
            <p className="rounded-xl bg-c-blue-wash p-3 text-sm leading-6">
              The book assistant is not configured yet. Reading and progress
              tracking are available.
            </p>
          ) : status && !status.indexed ? (
            <p className="text-sm text-c-text-muted">
              This book is waiting for processing.
            </p>
          ) : null}
          <form onSubmit={send} className="border-t border-c-border pt-4">
            <Textarea
              aria-label="Question about this book"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What should I remember from this chapter?"
              rows={3}
              maxLength={1500}
            />
            <div className="mt-3 flex justify-end">
              <Button
                type="submit"
                size="sm"
                icon={Send}
                loading={busy}
                disabled={
                  !question.trim() || !status?.configured || !status?.indexed
                }
              >
                Ask this book
              </Button>
            </div>
          </form>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-c-danger">
          {error}
        </p>
      )}
    </div>
  )
}
