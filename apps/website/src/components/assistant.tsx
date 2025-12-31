'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { MaterialIcon } from './homepage/icon-mapping'
import { AIAssistantAnimation } from './homepage/ai-assistant-animation'
import { DashboardAnimation } from './homepage/dashboard-animation'
import { TestimonialsSection } from './sections/testimonials-section'
import { FeaturesGridSection } from './sections/features-grid-section'
import { TimeSavingsSection } from './sections/time-savings-section'
import { AccountingSection } from './sections/accounting-section'
import { IntegrationsSection } from './sections/integrations-section'
import { PricingSection } from './sections/pricing-section'
import type { Testimonial } from './sections/testimonials-section'

export function Assistant() {
  const router = useRouter()

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
        {/* Grid Pattern Background - Desktop Only */}
        <div className="hidden lg:flex absolute inset-0 items-center justify-center pointer-events-none z-0">
          <Image
            src="/images/grid-light.svg"
            alt="Grid Pattern"
            width={1728}
            height={1080}
            className="w-[1728px] h-screen object-cover opacity-100 dark:opacity-[12%] dark:hidden"
            priority
          />
          <Image
            src="/images/grid-dark.svg"
            alt="Grid Pattern"
            width={1728}
            height={1080}
            className="w-[1728px] h-screen object-cover opacity-[12%] hidden dark:block"
            priority
          />
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden flex flex-col relative pt-32 pb-8 sm:pt-40 sm:pb-8 md:pt-48 overflow-hidden">
          {/* Grid Pattern Background - Mobile/Tablet Only (Limited Height) */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-0" style={{ height: '600px' }}>
            <Image
              src="/images/grid-light.svg"
              alt="Grid Pattern"
              width={1728}
              height={1080}
              className="w-full h-[600px] object-cover opacity-100 dark:opacity-[12%] dark:hidden"
              priority
            />
            <Image
              src="/images/grid-dark.svg"
              alt="Grid Pattern"
              width={1728}
              height={1080}
              className="w-full h-[600px] object-cover opacity-[12%] hidden dark:block"
              priority
            />
          </div>
          <div className="flex flex-col justify-start items-center space-y-6 z-20 px-3 sm:px-4">
            <div className="space-y-4 text-center max-w-xl px-2 w-full">
              <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider">
                Assistant
              </p>
              <h1 className="font-serif text-4xl sm:text-4xl md:text-5xl leading-tight">
                <span className="text-foreground">Get clear answers</span>
              </h1>
              <p className="text-muted-foreground text-base leading-normal font-sans text-center mx-auto lg:hidden">
                Ask questions and get clear answers from your business data.
              </p>
              <p className="text-muted-foreground text-base leading-normal font-sans text-center mx-auto hidden lg:block">
                Ask questions about your business and get clear, contextual answers based on your real data, including revenue, expenses, cash flow, and recent changes.
              </p>
            </div>

            {/* Assistant Illustration */}
            <div className="flex justify-center w-full">
              <Image
                src="/images/file-Storage.svg"
                alt="Assistant Interface"
                width={1200}
                height={800}
                className="w-full max-w-6xl h-auto object-contain"
                priority
              />
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex flex-col min-h-screen relative pt-40 overflow-hidden">
          <div className="flex-1 flex flex-col justify-start items-center space-y-8 z-20 px-4 pt-16">
            {/* Main Heading */}
            <div className="text-center space-y-8 w-full">
              <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider">
                Assistant
              </p>
              <h1 className="font-serif text-8xl xl:text-9xl 2xl:text-[12rem] leading-tight text-center">
                <span className="text-foreground block">Get clear answers</span>
              </h1>

              <p className="text-muted-foreground text-base leading-normal max-w-2xl mx-auto font-sans text-center">
                Ask questions about your business and get clear, contextual answers based on your real data, including revenue, expenses, cash flow, and recent changes.
              </p>
            </div>

            {/* Assistant Illustration */}
            <div className="flex justify-center w-full">
              <Image
                src="/images/file-Storage.svg"
                alt="Assistant Interface"
                width={1200}
                height={800}
                className="w-full max-w-6xl h-auto object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* Highlight Feature Section with Animations */}
      <section className="bg-background py-12 sm:py-16 lg:pt-32 lg:pb-24">
        <div className="max-w-[1400px] mx-auto">
          <div className="space-y-16 sm:space-y-20 lg:space-y-32">
            {/* First Animation - AI Assistant */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-stretch">
              {/* Left: Title and Subtitle */}
              <div className="flex items-center">
                <div className="space-y-4 lg:space-y-6 text-center lg:text-left w-full">
                  <h2 className="font-sans text-2xl sm:text-2xl text-foreground">
                    Ask questions and generate reports
                  </h2>
                  <p className="font-sans text-base text-muted-foreground leading-normal max-w-lg mx-auto lg:mx-0">
                    Ask questions about revenue, expenses, cash flow, customers, and changes over time, and generate reports, summaries, and breakdowns based on your actual business data.
                  </p>
                </div>
              </div>

              {/* Right: Animation */}
              <div className="flex items-center justify-center p-6 lg:p-8 border border-border overflow-hidden relative bg-background">
                <div className="w-[400px] h-[500px] sm:w-[520px] sm:h-[640px] lg:w-[600px] lg:h-[700px] relative overflow-hidden z-10 flex items-center justify-center">
                  <div className="w-full h-full origin-center scale-[0.85] sm:scale-[0.90] lg:scale-[0.95]">
                    <AIAssistantAnimation onComplete={undefined} />
                  </div>
                </div>
              </div>
            </div>

            {/* Second Animation - Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-stretch">
              {/* Left: Title and Subtitle */}
              <div className="flex items-center lg:order-2">
                <div className="space-y-4 lg:space-y-6 text-center lg:text-left w-full">
                  <h2 className="font-sans text-2xl sm:text-2xl text-foreground">
                    Answers with full context
                  </h2>
                  <p className="font-sans text-base text-muted-foreground leading-normal max-w-lg mx-auto lg:mx-0">
                    The assistant understands your transactions, invoices, customers, projects, and files so answers are specific to your business, not generic outputs.
                  </p>
                </div>
              </div>

              {/* Right: Animation */}
              <div className="flex items-center justify-center p-6 lg:p-8 border border-border overflow-hidden relative bg-background lg:order-1">
                <div className="w-[400px] h-[500px] sm:w-[520px] sm:h-[640px] lg:w-[600px] lg:h-[700px] relative overflow-hidden z-10 flex items-center justify-center">
                  <div className="w-full h-full origin-center scale-[0.85] sm:scale-[0.90] lg:scale-[0.95]">
                    <DashboardAnimation onComplete={undefined} />
                  </div>
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

      {/* Time Savings Section */}
      <TimeSavingsSection />

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* Accounting Section */}
      <AccountingSection />

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

      {/* Integrations Section */}
      <IntegrationsSection />

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* Pricing Section */}
      <PricingSection />
    </div>
  )
}

