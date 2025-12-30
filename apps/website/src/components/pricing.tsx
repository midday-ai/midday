'use client'

import { PricingSection } from './sections/pricing-section'
import { FAQSection } from './sections/faq-section'

export function Pricing() {
  return (
    <div className="min-h-screen">
      {/* Pricing Section */}
      <PricingSection />

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* FAQ Section */}
      <FAQSection />
    </div>
  )
}

