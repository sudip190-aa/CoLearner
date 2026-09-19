import React from 'react'
import { Link } from 'react-router-dom'
import { parseChapterContent } from '../../lib/readerContent'
import { parseInline } from '../../lib/inlineMarkdown'

function Inline({ text }) {
  return parseInline(text).map((token, index) => {
    switch (token.type) {
      case 'bold':
        return <strong key={index}>{token.text}</strong>
      case 'code':
        return (
          <code
            key={index}
            className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em]"
          >
            {token.text}
          </code>
        )
      case 'link':
        return (
          <a
            key={index}
            href={token.href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="font-medium text-c-blue underline"
          >
            {token.text}
          </a>
        )
      case 'mention':
        return (
          <Link
            key={index}
            to={`/u/${token.username}`}
            className="font-semibold text-c-blue hover:underline"
          >
            {token.text}
          </Link>
        )
      default:
        return <React.Fragment key={index}>{token.text}</React.Fragment>
    }
  })
}

// Renders user text: paragraphs, "> quotes", ``` code blocks and the inline formats above.
// Nothing is injected as HTML, so user input cannot run script.
export function RichText({ text, className = '' }) {
  const blocks = parseChapterContent(text, { keepLineBreaks: true })
  return (
    <div className={`space-y-4 ${className}`}>
      {blocks.map((block, index) =>
        block.type === 'code' ? (
          <pre
            key={index}
            className="overflow-x-auto rounded-brand bg-c-text p-4 font-mono text-sm leading-6 text-white"
          >
            <code>{block.text}</code>
          </pre>
        ) : block.type === 'quote' ? (
          <blockquote
            key={index}
            className="border-l-4 border-c-blue bg-c-blue-wash px-4 py-2 italic"
          >
            <Inline text={block.text} />
          </blockquote>
        ) : (
          <p key={index} className="whitespace-pre-line break-words">
            <Inline text={block.text} />
          </p>
        ),
      )}
    </div>
  )
}

export default RichText
