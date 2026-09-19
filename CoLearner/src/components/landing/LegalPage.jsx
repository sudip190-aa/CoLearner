import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, FileText, ShieldCheck } from 'lucide-react'
import policies from '../../content/policies.json'

export function LegalPage({ policy }) {
  const document = policies[policy]
  const Icon = policy === 'terms' ? FileText : ShieldCheck
  return (
    <div className="container py-10 md:py-16">
      <header className="rounded-3xl bg-c-blue-wash px-6 py-10 sm:p-12">
        <div className="mb-6 flex items-center gap-3">
          <span className="rounded-xl bg-c-surface p-3 text-c-blue">
            <Icon size={24} aria-hidden="true" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-c-blue">
            CoLearn / Legal
          </span>
        </div>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {document.title}
        </h1>
        <p className="mt-5 inline-flex items-center gap-2 text-sm font-medium">
          <span
            className="h-2 w-2 rounded-full bg-c-yellow"
            aria-hidden="true"
          />
          Effective date:{' '}
          <time dateTime="2026-09-19">{document.effectiveDate}</time>
        </p>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-c-text-muted">
          {document.intro}
        </p>
      </header>
      <div className="grid items-start gap-10 py-10 md:py-14 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
        <aside className="rounded-2xl border border-c-border p-5 lg:sticky lg:top-24">
          <nav aria-label="On this page">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-c-text-muted">
              On this page
            </h2>
            <ol className="space-y-2">
              {document.sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex gap-2 rounded-md py-1.5 text-sm leading-relaxed text-c-text-muted hover:text-c-blue"
                  >
                    <span className="w-5 shrink-0 font-mono text-xs leading-6 text-c-blue">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <Link
            to={policy === 'terms' ? '/privacy' : '/terms'}
            className="mt-5 flex items-center gap-2 border-t border-c-border pt-5 text-sm font-medium text-c-blue"
          >
            {policy === 'terms' ? 'Privacy Policy' : 'Terms and Conditions'}
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </aside>
        <article className="min-w-0 max-w-3xl">
          {document.sections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-title`}
              className="scroll-mt-28 border-b border-c-border py-7 first:pt-0 last:border-0"
            >
              <h2
                id={`${section.id}-title`}
                className="text-xl font-semibold tracking-tight sm:text-2xl"
              >
                <span className="mr-3 text-c-blue">{index + 1}.</span>
                {section.title}
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-c-text-muted sm:text-base">
                {section.blocks.map((block, i) =>
                  block.type === 'list' ? (
                    <ul
                      key={i}
                      className="list-disc space-y-2 pl-5 marker:text-c-blue"
                    >
                      {block.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : block.type === 'email' ? (
                    <a
                      key={i}
                      href={`mailto:${block.text}`}
                      className="inline-flex break-all font-medium text-c-blue underline underline-offset-4"
                    >
                      {block.text}
                    </a>
                  ) : (
                    <p key={i}>{block.text}</p>
                  ),
                )}
              </div>
            </section>
          ))}
          <div className="mt-8 rounded-2xl bg-c-blue-wash p-6">
            <p className="font-medium">Need to get in touch?</p>
            <p className="mt-2 text-sm leading-relaxed text-c-text-muted">
              Send us a message if you have a question about this policy.
            </p>
            <Link
              to="/contact"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-c-blue"
            >
              Contact CoLearn <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </article>
      </div>
    </div>
  )
}
