import React from 'react'
import { Button } from '../ui'
import { ArrowRight } from 'lucide-react'

export const FinalCTA = () => {
  return (
    <section className="bg-c-yellow py-16 md:py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10 text-center">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-c-text mb-5 tracking-tight leading-tight max-w-2xl mx-auto">
          Stop learning alone.
        </h2>
        <p className="text-lg md:text-xl text-c-text mb-10 max-w-xl mx-auto font-medium">
          Join thousands of builders who are finishing projects, growing skills,
          and proving it with a portfolio — for free.
        </p>
        <Button
          size="lg"
          className="text-lg px-10 py-4 shadow-lg hover:shadow-xl transition-shadow"
        >
          Create your free account
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
        <p className="mt-5 text-sm text-c-text font-medium">
          No credit card. No BS. Just build.
        </p>
      </div>
    </section>
  )
}
