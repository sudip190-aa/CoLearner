import React from 'react'
import { Check, Minus } from 'lucide-react'
import { Button } from '../components/ui'
import { PageHeader } from '../components/layout/PageHeader'

const plans = [
  {
    name: 'Free',
    price: '$0',
    note: "You're here",
    features: [
      'Curated book library',
      'Reader and progress tracking',
      'Community discussions',
      'Public profile',
    ],
    variant: 'primary',
  },
  {
    name: 'Premium',
    price: '$12',
    note: 'Coming soon',
    features: [
      'Everything in Free',
      'Advanced learning paths',
      'Portfolio insights',
      'Project templates',
    ],
    variant: 'outline',
  },
  {
    name: 'Mentor',
    price: '$24',
    note: 'Coming soon',
    features: [
      'Everything in Premium',
      'Mentor profile tools',
      'Cohort spaces',
      'Feedback analytics',
    ],
    variant: 'outline',
  },
]
const comparison = [
  ['Curated learning library', true, true, true],
  ['Community and discussions', true, true, true],
  ['Public portfolio', true, true, true],
  ['Advanced learning paths', false, true, true],
  ['Mentor tools', false, false, true],
  ['Analytics and insights', false, true, true],
]
export default function Pricing() {
  return (
    <div>
      <PageHeader
        title="A learning plan that grows with you"
        subtitle="Start with the essential loop. Add more power when your practice is ready for it."
      />
      <div className="grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`relative rounded-brand-lg border p-6 shadow-sm ${plan.name === 'Free' ? 'border-c-blue bg-c-blue-wash' : 'border-c-border bg-white'}`}
          >
            {plan.name === 'Free' && (
              <span className="absolute right-5 top-5 rounded-full bg-c-yellow px-2.5 py-1 text-xs font-bold text-c-text">
                You're here
              </span>
            )}
            <h2 className="text-xl font-bold text-c-text">{plan.name}</h2>
            <p className="mt-5 text-4xl font-bold text-c-text">
              {plan.price}
              <span className="text-sm font-medium text-c-text-muted">
                /month
              </span>
            </p>
            <p className="mt-2 text-sm font-semibold text-c-text-muted">
              {plan.note}
            </p>
            <ul className="mt-7 space-y-3">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-c-text"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-c-success" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              className="mt-8"
              fullWidth
              variant={plan.variant}
              disabled={plan.name !== 'Free'}
            >
              {plan.name === 'Free' ? 'Current plan' : 'Coming soon'}
            </Button>
          </article>
        ))}
      </div>
      <section className="mt-16">
        <h2 className="text-2xl font-bold text-c-text">Compare plans</h2>
        <div className="mt-5 overflow-hidden rounded-brand-lg border border-c-border bg-white">
          <div className="grid grid-cols-4 bg-slate-50 p-4 text-sm font-bold">
            <span>Feature</span>
            <span className="text-center">Free</span>
            <span className="text-center">Premium</span>
            <span className="text-center">Mentor</span>
          </div>
          {comparison.map(([feature, free, premium, mentor]) => (
            <div
              key={feature}
              className="grid grid-cols-4 border-t border-c-border p-4 text-sm"
            >
              <span className="text-c-text">{feature}</span>
              {[free, premium, mentor].map((value, index) => (
                <span key={index} className="flex justify-center">
                  {value ? (
                    <Check className="h-4 w-4 text-c-success" />
                  ) : (
                    <Minus className="h-4 w-4 text-c-text-muted" />
                  )}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>
      <section className="mt-16 max-w-3xl">
        <h2 className="text-2xl font-bold text-c-text">FAQ</h2>
        <div className="mt-5 divide-y divide-c-border rounded-brand-lg border border-c-border bg-white px-5">
          {[
            [
              'Can I use Colearn for free?',
              'Yes. The Free plan includes the core Learn, Build, Prove, and Engage loop.',
            ],
            [
              'When will paid plans launch?',
              'Premium and Mentor are being shaped with the community. We will share timing when they are ready.',
            ],
            [
              'Can I switch plans later?',
              'Absolutely. Your work and learning history stay with you as your plan changes.',
            ],
          ].map(([question, answer]) => (
            <details key={question} className="py-4">
              <summary className="cursor-pointer text-sm font-bold text-c-text">
                {question}
              </summary>
              <p className="mt-2 text-sm leading-6 text-c-text-muted">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
