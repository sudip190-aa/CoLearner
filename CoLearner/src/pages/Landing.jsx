import React from 'react'
import { Hero } from '../components/landing/Hero'
import { SocialProof } from '../components/landing/SocialProof'
import { ProblemSolution } from '../components/landing/ProblemSolution'
import { Pillars } from '../components/landing/Pillars'
import { HowItWorks } from '../components/landing/HowItWorks'
import { FeatureShowcase } from '../components/landing/FeatureShowcase'
import { GamificationBand } from '../components/landing/GamificationBand'
import { Comparison } from '../components/landing/Comparison'
import { Testimonials } from '../components/landing/Testimonials'
import { Stats } from '../components/landing/Stats'
import { FAQ } from '../components/landing/FAQ'
import { FinalCTA } from '../components/landing/FinalCTA'
import { LandingNav } from '../components/landing/LandingNav'
import { LandingFooter } from '../components/landing/LandingFooter'
import { FadeUp } from '../components/landing/FadeUp'

export const Landing = () => {
  return (
    <div className="bg-white min-h-screen overflow-x-hidden text-c-text font-sans">
      <LandingNav />

      {/* 1. Hero — no fade, instant impact */}
      <Hero />

      {/* 2. Social Proof */}
      <FadeUp>
        <SocialProof />
      </FadeUp>

      {/* 3. Problem / Solution */}
      <FadeUp>
        <ProblemSolution />
      </FadeUp>

      {/* 4. Four Pillars */}
      <FadeUp>
        <Pillars />
      </FadeUp>

      {/* 5. How it Works */}
      <FadeUp>
        <HowItWorks />
      </FadeUp>

      {/* 6. Feature Showcase — each row has its own intersection handling internally */}
      <FeatureShowcase />

      {/* 7. Gamification Band */}
      <FadeUp>
        <GamificationBand />
      </FadeUp>

      {/* 8. Comparison table */}
      <FadeUp>
        <Comparison />
      </FadeUp>

      {/* 9. Testimonials */}
      <FadeUp>
        <Testimonials />
      </FadeUp>

      {/* 10. Stats with per-number count-up */}
      <Stats />

      {/* 11. FAQ accordion */}
      <FadeUp>
        <FAQ />
      </FadeUp>

      {/* 12. Final CTA band */}
      <FinalCTA />

      {/* 13. Footer — already built, confirmed wired */}
      <FadeUp>
        <LandingFooter />
      </FadeUp>
    </div>
  )
}

export default Landing
