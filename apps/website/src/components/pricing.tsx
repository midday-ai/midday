'use client'

import { PricingSection } from './sections/pricing-section'
import { FAQSection } from './sections/faq-section'

export function Pricing() {
  return (
    <div className="min-h-screen">
      {/* Pricing Section */}
      <div className="pt-24 sm:pt-16 lg:pt-20">
      <PricingSection />
      </div>

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* FAQ Section */}
      <FAQSection />
    </div>
  )
}

