'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { MaterialIcon } from './homepage/icon-mapping'
import { DashboardAnimation } from './homepage/dashboard-animation'
import { TestimonialsSection } from './sections/testimonials-section'
import { FeaturesGridSection } from './sections/features-grid-section'
import { TimeSavingsSection } from './sections/time-savings-section'
import { AccountingSection } from './sections/accounting-section'
import { IntegrationsSection } from './sections/integrations-section'
import { PricingSection } from './sections/pricing-section'
import type { Testimonial } from './sections/testimonials-section'

export function TimeTracking() {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isLightMode = mounted && resolvedTheme ? resolvedTheme !== 'dark' : true

  const testimonials: Testimonial[] = [
    {
      name: 'Sarah Chen',
      title: 'Freelance Designer',
      content:
        'Midday transformed how I manage my freelance business. No more scattered receipts or manual invoice tracking. Everything is organized automatically, saving me 3+ hours every week.',
      fullContent:
        'Midday transformed how I manage my freelance business. No more scattered receipts or manual invoice tracking. Everything is organized automatically, saving me 3+ hours every week.\n\nAs a freelance designer working with multiple clients, I used to spend hours every week organizing receipts, categorizing expenses, and manually entering data into spreadsheets. It was tedious and error-prone.\n\nWith Midday, everything happens automatically. When I upload a receipt, it\'s instantly categorized and linked to the right project. The AI even extracts vendor information and matches it with my existing contacts. The time I used to spend on admin work, I now spend on actual design work for my clients.\n\nThe search functionality is incredible too. I can type \'office supplies March\' and instantly find all related expenses. It\'s like having a personal assistant who never forgets anything.',
    },
    {
      name: 'Marcus Rodriguez',
      title: 'Small Business Owner',
      content:
        'As a restaurant owner, tracking expenses was a nightmare. Midday\'s AI automatically categorizes everything from ingredient purchases to equipment repairs. Game changer!',
      fullContent:
        'As a restaurant owner, tracking expenses was a nightmare. Midday\'s AI automatically categorizes everything from ingredient purchases to equipment repairs. Game changer!\n\nRunning a restaurant means dealing with dozens of vendors, daily ingredient purchases, equipment maintenance, and staff expenses. Before Midday, I had boxes of receipts and no clear picture of where my money was going.\n\nNow, every receipt gets scanned and categorized automatically. Food costs, equipment repairs, utilities - everything is organized without me lifting a finger. The insights dashboard shows me exactly where I\'m spending too much and where I can optimize.\n\nLast month, I discovered I was overpaying for produce by 15% because Midday highlighted pricing patterns across different suppliers. That insight alone saved me more than the software costs for the entire year.',
    },
    {
      name: 'Emily Watson',
      title: 'Startup Founder',
      content:
        'Running a tech startup means juggling countless expenses. Midday\'s smart file organization and automated reconciliation let me focus on building, not bookkeeping.',
      fullContent:
        'Running a tech startup means juggling countless expenses. Midday\'s smart file organization and automated reconciliation let me focus on building, not bookkeeping.\n\nAs a startup founder, every minute counts. I need to focus on product development, customer acquisition, and fundraising - not sorting through receipts and matching bank transactions.\n\nMidday\'s automated reconciliation is a lifesaver. It connects my bank accounts, credit cards, and expense receipts automatically. When I get back from a business trip, all my expenses are already categorized and ready for reimbursement.\n\nThe reporting features help me prepare for investor meetings too. I can generate clean expense reports by category, track burn rate, and identify cost optimization opportunities. It\'s like having a CFO in my pocket, but for a fraction of the cost.',
    },
    {
      name: 'David Kim',
      title: 'Consultant',
      content:
        'Client work means tons of receipts and invoices. Midday\'s natural language search finds any document instantly. \'Show me Q1 expenses for Client X\' - boom, there it is.',
      fullContent:
        'Client work means tons of receipts and invoices. Midday\'s natural language search finds any document instantly. \'Show me Q1 expenses for Client X\' - boom, there it is.\n\nAs an independent consultant working with multiple clients simultaneously, document organization used to be my biggest pain point. Client dinners, travel expenses, software subscriptions - everything needed to be tracked separately for accurate billing.\n\nMidday\'s natural language search is phenomenal. Instead of remembering folder structures or file names, I just describe what I\'m looking for. \'Show me all restaurant expenses for the Johnson project in March\' - and there it is, instantly.\n\nThe client reporting feature automatically generates expense summaries by project. At the end of each month, I can send clean, professional expense reports to my clients with just a few clicks. My clients love the transparency, and I love getting paid faster.',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-background relative min-h-screen overflow-hidden">
        {/* Grid Pattern Background */}
        <div className="absolute inset-0 opacity-10 flex items-center justify-center">
          <Image
            src={isLightMode ? "/images/grid-light.svg" : "/images/grid-dark.svg"}
            alt="Grid Pattern"
            width={1728}
            height={1080}
            className="w-[1728px] h-screen object-cover"
            priority
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-20 flex flex-col items-center justify-center min-h-screen px-6 py-20 pt-32 lg:pt-40">
          {/* Main Heading */}
          <div className="text-center space-y-8 mb-10">
            <h1 className="font-serif text-4xl lg:text-8xl xl:text-9xl 2xl:text-[12rem] leading-tight">
              <span className="text-foreground block">See where time goes</span>
            </h1>

            <p className="text-muted-foreground text-sm lg:text-base leading-relaxed max-w-2xl mx-auto font-sans">
              Track time across projects and customers and understand how hours translate into costs, revenue, and margins inside your financial overview.
            </p>
          </div>

          {/* Time Tracking Illustration */}
          <div className="flex justify-center w-full">
            <Image
              src="/images/file-Storage.svg"
              alt="Time Tracking Interface"
              width={1200}
              height={800}
              className="w-full max-w-6xl h-auto object-contain"
              priority
            />
          </div>
        </div>
      </div>

      {/* Highlight Feature Section with Animations */}
      <section className="bg-background py-20 lg:py-24">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="space-y-24 lg:space-y-32">
            {/* First Animation - Time Tracking */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left: Title and Subtitle */}
              <div className="space-y-4 lg:space-y-6">
                <h2 className="font-serif text-xl sm:text-2xl text-foreground">
                  Track time across projects
                </h2>
                <p className="font-sans text-sm lg:text-base text-muted-foreground leading-relaxed max-w-lg">
                  Log time spent on different projects and customers to understand where your hours are going.
                </p>
              </div>

              {/* Right: Animation */}
              <div className="w-full border border-border overflow-hidden p-1 sm:p-3 relative bg-background">
                {/* Grid Pattern Background */}
                <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none z-0">
                  <Image
                    src={isLightMode ? "/images/grid-light.svg" : "/images/grid-dark.svg"}
                    alt="Grid Pattern"
                    width={1728}
                    height={1080}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
                <div className="w-full h-[520px] sm:h-[620px] relative overflow-hidden flex items-center justify-center z-10">
                  <div className="w-full h-full origin-center scale-[0.87] sm:scale-[0.9]">
                    <DashboardAnimation onComplete={undefined} />
                  </div>
                </div>
              </div>
            </div>

            {/* Second Animation - Financial Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left: Title and Subtitle */}
              <div className="space-y-4 lg:space-y-6 lg:order-2">
                <h2 className="font-serif text-xl sm:text-2xl text-foreground">
                  Understand costs and margins
                </h2>
                <p className="font-sans text-sm lg:text-base text-muted-foreground leading-relaxed max-w-lg">
                  See how tracked time translates into costs, revenue, and margins in your financial overview.
                </p>
              </div>

              {/* Right: Animation */}
              <div className="w-full border border-border overflow-hidden p-1 sm:p-3 relative bg-background lg:order-1">
                {/* Grid Pattern Background */}
                <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none z-0">
                  <Image
                    src={isLightMode ? "/images/grid-light.svg" : "/images/grid-dark.svg"}
                    alt="Grid Pattern"
                    width={1728}
                    height={1080}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
                <div className="w-full h-[520px] sm:h-[620px] relative overflow-hidden flex items-center justify-center z-10">
                  <div className="w-full h-full origin-center scale-[0.87] sm:scale-[0.9]">
                    <DashboardAnimation onComplete={undefined} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-8">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* Features Grid Section */}
      <FeaturesGridSection />

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-8">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* Time Savings Section */}
      <TimeSavingsSection />

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-8">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* Accounting Section */}
      <AccountingSection />

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-8">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* Testimonials Section */}
      <TestimonialsSection
        testimonials={testimonials}
        customHeader={
          <>
            <div className="flex flex-col gap-4 items-center mb-10">
              <div className="flex flex-col gap-4 items-center text-center max-w-3xl">
                <h2 className="font-serif text-2xl text-foreground">
                  Built with our users, for our users
                </h2>
                <p className="font-sans text-sm text-muted-foreground">
                  Midday helps small teams, solo founders, and small businesses
                  do more with less. Here's what that looks like in practice.
                </p>
              </div>

              <div className="flex gap-2 items-center">
                <div className="flex items-center gap-1">
                  <div className="flex gap-1">
                    <MaterialIcon name="star" className="text-muted-foreground" size={16} />
                    <MaterialIcon name="star" className="text-muted-foreground" size={16} />
                    <MaterialIcon name="star" className="text-muted-foreground" size={16} />
                    <MaterialIcon name="star" className="text-muted-foreground" size={16} />
                    <MaterialIcon name="star_half" className="text-muted-foreground" size={16} />
                  </div>
                </div>
                <p className="font-sans text-xs text-muted-foreground">
                  Used by 14,000 businesses
                </p>
              </div>
            </div>
          </>
        }
      />

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-8">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* Integrations Section */}
      <IntegrationsSection />

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-8">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* Pricing Section */}
      <PricingSection />
    </div>
  )
}

