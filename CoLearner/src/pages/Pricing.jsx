import React from 'react'
import { Check, Minus, ArrowRight, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui'
import { useAuthStore } from '../store/authStore'

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Build your foundation and find your people.',
    features: [
      'Curated book library',
      'Reader and progress tracking',
      'Community discussions',
      'Public profile',
    ],
  },
  {
    name: 'Premium',
    price: '$12',
    description: 'More guidance for your next stage of learning.',
    features: [
      'Everything in Free',
      'Advanced learning paths',
      'Portfolio insights',
      'Project templates',
    ],
  },
  {
    name: 'Mentor',
    price: '$24',
    description: 'Tools to support the people you help grow.',
    features: [
      'Everything in Premium',
      'Mentor profile tools',
      'Cohort spaces',
      'Feedback analytics',
    ],
  },
]
const comparison = [
  ['Curated learning library', true, true, true],
  ['Community discussions', true, true, true],
  ['Public portfolio', true, true, true],
  ['Advanced learning paths', false, true, true],
  ['Mentor tools', false, false, true],
  ['Analytics and insights', false, true, true],
]
export default function Pricing() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return (
    <div className="container py-12 md:py-20">
      <header className="mx-auto max-w-2xl text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-c-blue">
          Simple plans
        </p>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Start learning. Keep growing.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-c-text-muted">
          Start with the essentials, for free. More ways to learn and mentor are
          on the way.
        </p>
      </header>
      <section
        aria-label="Available and upcoming plans"
        className="mt-12 grid gap-5 lg:grid-cols-3"
      >
        {plans.map((plan, index) => (
          <article
            key={plan.name}
            className={`flex flex-col rounded-2xl border p-7 sm:p-8 ${index === 0 ? 'border-c-blue bg-c-blue-wash' : 'border-c-border bg-white'}`}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${index === 0 ? 'bg-c-yellow text-c-text' : 'bg-c-blue-soft text-c-blue'}`}
              >
                {index === 0 ? 'Available now' : 'Coming soon'}
              </span>
            </div>
            <p className="mt-4 min-h-[48px] text-sm leading-relaxed text-c-text-muted">
              {plan.description}
            </p>
            <p className="mt-6 flex items-baseline gap-1">
              <span className="text-5xl font-semibold tracking-tight">
                {plan.price}
              </span>
              <span className="text-sm text-c-text-muted">/ month</span>
            </p>
            <p className="mt-3 text-xs text-c-text-muted">
              {index === 0
                ? 'No payment required to get started.'
                : 'Planned monthly pricing. Not available yet.'}
            </p>
            <ul className="mb-8 mt-7 flex-1 space-y-4 border-t border-c-border pt-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <Check
                    size={17}
                    className="mt-0.5 shrink-0 text-c-blue"
                    aria-hidden="true"
                  />
                  {feature}
                </li>
              ))}
            </ul>
            {index === 0 ? (
              <Button
                to={isAuthenticated ? '/dashboard' : '/signup'}
                fullWidth
                icon={ArrowRight}
                iconPosition="right"
              >
                {isAuthenticated ? 'Go to dashboard' : 'Get started free'}
              </Button>
            ) : (
              <div className="rounded-brand border border-c-border bg-c-blue-wash py-2.5 text-center text-sm font-medium text-c-text-muted">
                Coming soon
              </div>
            )}
          </article>
        ))}
      </section>
      <section className="mt-16 md:mt-20" aria-labelledby="compare-title">
        <div className="mb-6">
          <h2
            id="compare-title"
            className="text-2xl font-semibold tracking-tight"
          >
            A closer look
          </h2>
          <p className="mt-2 text-sm text-c-text-muted">
            Premium and Mentor features are planned for future release.
          </p>
        </div>
        <div
          className="relative overflow-x-auto rounded-2xl border border-c-border"
          role="region"
          aria-label="Plan comparison table"
          tabIndex={0}
        >
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <caption className="sr-only">
              Current Free features and planned Premium and Mentor features
            </caption>
            <thead className="bg-c-blue-wash">
              <tr>
                <th scope="col" className="px-6 py-4 text-left font-semibold">
                  What's included
                </th>
                {plans.map((plan) => (
                  <th
                    key={plan.name}
                    scope="col"
                    className="px-4 py-4 text-center font-semibold"
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.map(([feature, ...values]) => (
                <tr key={feature} className="border-t border-c-border">
                  <th scope="row" className="px-6 py-4 text-left font-normal">
                    {feature}
                  </th>
                  {values.map((included, i) => (
                    <td key={i} className="px-4 py-4 text-center">
                      <span className="sr-only">
                        {included
                          ? i === 0
                            ? 'Included'
                            : 'Planned'
                          : 'Not included'}
                      </span>
                      {included ? (
                        <Check
                          size={17}
                          className="mx-auto text-c-blue"
                          aria-hidden="true"
                        />
                      ) : (
                        <Minus
                          size={17}
                          className="mx-auto text-c-text-muted"
                          aria-hidden="true"
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section
        className="mt-16 grid gap-8 border-t border-c-border pt-10 md:mt-20 md:grid-cols-[1fr_1.5fr] md:gap-16"
        aria-labelledby="pricing-questions"
      >
        <div>
          <h2
            id="pricing-questions"
            className="text-2xl font-semibold tracking-tight"
          >
            A few helpful answers.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-c-text-muted">
            Something else on your mind?
          </p>
          <Link
            to="/contact"
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-c-blue hover:underline"
          >
            Get in touch <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="divide-y divide-c-border">
          {[
            [
              'Can I use CoLearn for free?',
              'Yes. Create an account to access the library, track your reading, join discussions, and build your public profile.',
            ],
            [
              'Are paid plans available?',
              'Not yet. Premium and Mentor are coming soon. Their prices and features shown here are planned offerings.',
            ],
            [
              'Do I need a card to get started?',
              'No. You can create a Free account without entering payment details.',
            ],
          ].map(([question, answer]) => (
            <details key={question} className="group py-5 first:pt-0">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                {question}
                <ChevronDown
                  size={17}
                  className="shrink-0 text-c-text-muted transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-c-text-muted">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
