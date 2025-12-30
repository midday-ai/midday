'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { Button } from '@midday/ui/button'
import { FeaturesGridSection } from './sections/features-grid-section'
import { TimeSavingsSection } from './sections/time-savings-section'
import { AccountingSection } from './sections/accounting-section'
import { TestimonialsSection } from './sections/testimonials-section'
import { IntegrationsSection } from './sections/integrations-section'
import { PricingSection } from './sections/pricing-section'
import type { Testimonial } from './sections/testimonials-section'

export function Download() {
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
      <div className="bg-background relative overflow-visible lg:min-h-screen lg:overflow-hidden">
        {/* Mobile Layout */}
        <div className="lg:hidden flex flex-col relative pt-32 pb-16 sm:pt-40 sm:pb-20 md:pt-48 overflow-hidden">

          <div className="flex flex-col justify-start items-center space-y-8 z-20 px-4 sm:px-6">
            {/* Dock Image */}
            <div className="flex justify-center w-full">
              <Image
                src={isLightMode ? '/images/dock-light.png' : '/images/dock-dark.png'}
                alt="Mac Dock"
                width={800}
                height={200}
                className="w-full max-w-md h-auto object-contain"
                priority
              />
            </div>

            {/* Title and Description */}
            <div className="space-y-4 text-center max-w-xl w-full">
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight text-foreground">
                Midday for Mac
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base leading-normal font-sans text-center mx-auto">
                With Midday on Mac you have everything accessible just one click away.
              </p>
            </div>

            {/* Download Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-md mx-auto justify-center sm:justify-center">
              <Button
                className="w-full sm:w-auto h-11 px-6 text-sm font-sans"
              >
                Apple Silicon
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto h-11 px-6 text-sm font-sans bg-background border-border hover:bg-accent"
              >
                Intel Macs
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex flex-col min-h-screen relative pt-40 overflow-hidden">
          <div className="flex-1 flex flex-col justify-center items-center space-y-8 z-20 px-4 pb-32">
            {/* Dock Image - Centered */}
            <div className="flex justify-center w-full">
              <Image
                src={isLightMode ? '/images/dock-light.png' : '/images/dock-dark.png'}
                alt="Mac Dock"
                width={1200}
                height={300}
                className="w-full max-w-xl h-auto object-contain"
                priority
              />
            </div>

            {/* Title and Description */}
            <div className="text-center space-y-4 w-full">
              <h1 className="font-serif text-6xl xl:text-7xl 2xl:text-8xl leading-tight text-foreground">
                Midday for Mac
              </h1>
              <p className="text-muted-foreground text-sm xl:text-base leading-normal max-w-xl mx-auto font-sans text-center">
                With Midday on Mac you have everything accessible just one click away.
              </p>
            </div>

            {/* Download Buttons */}
            <div className="flex gap-6 justify-center">
              <Button
                className="h-11 px-6 text-sm font-sans"
              >
                Apple Silicon
              </Button>
              <Button
                variant="outline"
                className="h-11 px-6 text-sm font-sans bg-background border-border hover:bg-accent"
              >
                Intel Macs
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="bg-background py-16 sm:py-20 lg:py-28">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-stretch">
            {/* Left Feature - Native Performance */}
            <div className="flex flex-col gap-8 lg:gap-12 p-8 lg:p-10 flex-1">
              <div className="space-y-2 text-center">
                <h2 className="font-serif text-xl sm:text-2xl text-foreground">
                  Native performance
                </h2>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  Midday runs fast and light on Apple silicon so your assistant stays responsive and your workflow stays smooth
                </p>
              </div>

              {/* Apple Logo Image */}
              <div className="flex justify-center mt-auto">
                <div className="p-10 lg:p-14 bg-background">
                  <Image
                    src={isLightMode ? '/images/apple-light.svg' : '/images/apple-dark.svg'}
                    alt="Apple Logo"
                    width={300}
                    height={300}
                    className="w-40 h-40 lg:w-56 lg:h-56 object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Vertical Divider - Desktop Only */}
            <div className="hidden lg:block w-px border-l border-border self-stretch" />

            {/* Horizontal Divider - Mobile Only */}
            <div className="lg:hidden h-px w-full border-t border-border my-8" />

            {/* Right Feature - Universal Search */}
            <div className="flex flex-col gap-8 lg:gap-12 p-8 lg:p-10 flex-1">
              <div className="space-y-2 text-center">
                <h2 className="font-serif text-xl sm:text-2xl text-foreground">
                  Universal search anywhere
                </h2>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  Press <span className="text-foreground font-mono">⇧ ⌥ K</span> to open Midday's search from anywhere on your Mac. Instantly find invoices, tasks and files even when the app is closed
                </p>
              </div>

              {/* Keyboard Image */}
              <div className="flex justify-center lg:justify-end mt-auto">
                <div className="p-4 lg:p-6 bg-background w-full max-w-lg">
                  <Image
                    src={isLightMode ? '/images/keyboard-light.svg' : '/images/keyboard-dark.svg'}
                    alt="Keyboard Shortcut"
                    width={600}
                    height={400}
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* Features Grid Section */}
      <FeaturesGridSection />

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* Testimonials Section */}
      <TestimonialsSection
        testimonials={testimonials}
        title="Built with our users, for our users"
        subtitle="Midday helps small teams, solo founders, and small businesses do more with less. Here's what that looks like in practice."
      />

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* Pricing Section */}
      <PricingSection />
    </div>
  )
}

