import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, Hash, HelpCircle, X } from 'lucide-react'
import {
  Button,
  Chip,
  Input,
  RichText,
  Select,
  useToast,
} from '../components/ui'
import { PageHeader } from '../components/layout/PageHeader'
import { community } from '../services/api.js'

import MentionTextarea from '../components/community/MentionTextarea'

const categories = ['Frontend', 'Backend', 'Product', 'Career', 'Community']

function Preview({ title, category, body, tags }) {
  return (
    <article className="rounded-brand-lg border border-c-border bg-c-surface p-6 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-c-blue">
        <span>{category || 'Category'}</span>
        <span className="text-c-border">/</span>
        <span>Preview</span>
      </div>
      <h1 className="mt-4 text-3xl font-bold leading-tight text-c-text">
        {title || 'Your discussion title'}
      </h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {tags.length ? (
          tags.map((tag) => <Chip key={tag}>{tag}</Chip>)
        ) : (
          <span className="text-sm text-c-text-muted">
            Your tags will appear here.
          </span>
        )}
      </div>
      {body.trim() ? (
        <RichText
          text={body}
          className="mt-8 max-w-none text-base leading-8 text-c-text"
        />
      ) : (
        <p className="mt-8 text-c-text-muted">
          Your discussion body will appear here.
        </p>
      )}
    </article>
  )
}

export default function NewThread() {
  const navigate = useNavigate()
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [body, setBody] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState([])
  const [preview, setPreview] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const addTag = (event) => {
    if (
      (event.key === 'Enter' || event.key === ',') &&
      tagInput.trim() &&
      tags.length < 5
    ) {
      event.preventDefault()
      const value = tagInput.trim().replace(/^#/, '').toLowerCase()
      if (value && !tags.includes(value)) setTags((items) => [...items, value])
      setTagInput('')
    }
  }
  const removeTag = (tag) =>
    setTags((items) => items.filter((item) => item !== tag))
  const publish = async (event) => {
    event.preventDefault()
    if (!title.trim() || !category || !body.trim()) return
    setPublishing(true)
    setError('')
    setFieldErrors({})
    try {
      const result = await community.createThread({
        title: title.trim(),
        category,
        body: body.trim(),
        tags,
      })
      // Only claim XP the server actually paid (it stops paying after a few threads a day).
      if (result.xpAwarded > 0)
        toast.success(`+${result.xpAwarded} XP`, 'Discussion published')
      else toast.success('Discussion published')
      navigate(`/community/${result.thread.slug}`)
    } catch (submitError) {
      const fields = Object.fromEntries(
        Object.entries(submitError?.fields || {}).map(([key, value]) => [
          key,
          Array.isArray(value) ? value[0] : value,
        ]),
      )
      setFieldErrors(fields)
      setError(
        Object.keys(fields).length
          ? 'Please fix the highlighted fields.'
          : submitError?.message ||
              'We could not publish your discussion. Please try again.',
      )
      setPublishing(false)
    }
  }
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Start a discussion"
        subtitle="Ask a focused question and invite the community to think with you."
      />
      <div className="mb-5 flex items-center justify-between border-b border-c-border">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPreview(false)}
            className={`border-b-2 px-3 py-3 text-sm font-semibold ${!preview ? 'border-c-blue text-c-blue' : 'border-transparent text-c-text-muted'}`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setPreview(true)}
            className={`border-b-2 px-3 py-3 text-sm font-semibold ${preview ? 'border-c-blue text-c-blue' : 'border-transparent text-c-text-muted'}`}
          >
            <Eye className="mr-1 inline h-4 w-4" />
            Preview
          </button>
        </div>
        <Link
          to="/community"
          className="text-sm font-semibold text-c-text-muted hover:text-c-blue"
        >
          Cancel
        </Link>
      </div>
      {preview ? (
        <Preview title={title} category={category} body={body} tags={tags} />
      ) : (
        <form
          onSubmit={publish}
          className="space-y-5 rounded-brand-lg border border-c-border bg-c-surface p-6 shadow-sm"
        >
          <Input
            label="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What would you like to explore?"
            error={fieldErrors.title}
            required
          />
          <Select
            label="Category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            options={categories}
            placeholder="Choose a category"
            error={fieldErrors.category}
            required
          />
          <div>
            <MentionTextarea
              label="Body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={12}
              maxLength={20000}
              placeholder="Share context, what you tried, and the question you want help with..."
              error={fieldErrors.body}
              required
            />
            <div className="mt-2 flex items-center gap-3 rounded-brand bg-c-blue-wash p-3 text-xs text-c-text-muted">
              <Hash className="h-4 w-4 shrink-0 text-c-blue" />
              <span>
                Formatting: **bold**, `code`, [links](https://example.com), &gt;
                quotes, ``` code blocks and @mentions.
              </span>
              <HelpCircle className="ml-auto h-4 w-4 shrink-0" />
            </div>
          </div>
          <div>
            <label
              htmlFor="thread-tags"
              className="mb-2 block text-sm font-semibold text-c-text"
            >
              Tags{' '}
              <span className="font-normal text-c-text-muted">
                ({tags.length}/5)
              </span>
            </label>
            <div className="flex flex-wrap items-center gap-2 rounded-brand border border-c-border bg-c-surface p-2 focus-within:border-c-blue focus-within:ring-2 focus-within:ring-c-blue/20">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-c-blue-soft px-2.5 py-1 text-xs font-medium text-c-blue"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    aria-label={`Remove ${tag}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                id="thread-tags"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={addTag}
                disabled={tags.length >= 5}
                placeholder={
                  tags.length >= 5
                    ? 'Tag limit reached'
                    : 'Type a tag and press Enter'
                }
                className="min-w-[180px] flex-1 border-0 px-1 py-1 text-sm outline-none placeholder:text-c-text-muted/60"
              />
            </div>
            {fieldErrors.tags ? (
              <p className="mt-2 text-xs text-c-danger" role="alert">
                {fieldErrors.tags}
              </p>
            ) : (
              <p className="mt-2 text-xs text-c-text-muted">
                Use specific tags to help the right people find your question.
              </p>
            )}
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-brand bg-c-danger-soft px-3 py-2 text-sm text-c-danger"
            >
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3 border-t border-c-border pt-5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/community')}
            >
              Cancel
            </Button>
            <Button type="submit" loading={publishing}>
              Publish discussion
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
