'use client'

import { useState, useEffect } from 'react'
import { motion, useMotionValue } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContainer,
  MorphingDialogContent,
  MorphingDialogClose,
  MorphingDialogTitle,
  MorphingDialogSubtitle,
  MorphingDialogDescription,
} from './motion-primitives/morphing-dialog'
import { MaterialIcon } from './homepage/icon-mapping'

export function FileStorage() {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const dragX = useMotionValue(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isLightMode = mounted && resolvedTheme ? resolvedTheme !== 'dark' : true

  const testimonials = [
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
        <div className={`hidden lg:flex absolute inset-0 items-center justify-center pointer-events-none z-0 ${isLightMode ? 'opacity-100' : 'opacity-[15%]'}`}>
          <Image
            src={isLightMode ? "/images/grid-light.svg" : "/images/grid-dark.svg"}
            alt="Grid Pattern"
            width={1728}
            height={1080}
            className="w-[1728px] h-screen object-cover"
            priority
          />
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden flex flex-col relative pt-32 pb-8 sm:pt-40 sm:pb-8 md:pt-48 overflow-hidden">
          {/* Grid Pattern Background - Mobile/Tablet Only (Limited Height) */}
          <div className={`absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-0 ${isLightMode ? 'opacity-100' : 'opacity-[15%]'}`} style={{ height: '600px' }}>
            <Image
              src={isLightMode ? "/images/grid-light.svg" : "/images/grid-dark.svg"}
              alt="Grid Pattern"
              width={1728}
              height={1080}
              className="w-[1728px] h-[600px] object-cover"
              priority
            />
          </div>
          <div className="flex flex-col justify-start items-center space-y-6 z-20 px-3 sm:px-4">
            <div className="space-y-4 text-center max-w-xl px-2">
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight">
                <span className="text-foreground">Everything in one place</span>
              </h1>
              <p className="text-muted-foreground text-base leading-relaxed font-sans">
                Smart storage that automatically organizes and connects files to transactions, invoices, and customers so you can always find what you need.
              </p>
            </div>

            {/* File Storage Illustration */}
            <div className="flex justify-center w-full">
              <Image
                src="/images/file-Storage.svg"
                alt="File Storage Interface"
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
              <h1 className="font-serif text-8xl xl:text-9xl 2xl:text-[12rem] leading-tight text-center">
                <span className="text-foreground block">Everything in one place</span>
              </h1>

              <p className="text-muted-foreground text-base leading-relaxed max-w-2xl mx-auto font-sans">
                Smart storage that automatically organizes and connects files to transactions, invoices, and customers so you can always find what you need.
              </p>
            </div>

            {/* File Storage Illustration */}
            <div className="flex justify-center w-full">
              <Image
                src="/images/file-Storage.svg"
                alt="File Storage Interface"
                width={1200}
                height={800}
                className="w-full max-w-6xl h-auto object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* Feature Section - Files Organized & Everything Searchable */}
      <section className="bg-background py-20">
        <div className="max-w-[1400px] mx-auto px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative">
            {/* Vertical Divider */}
            <div className="absolute bg-border h-full w-px left-1/2 top-0 transform -translate-x-1/2 hidden lg:block" />

            {/* Left - Files, organized by context */}
            <div className="space-y-12 p-10 relative">
              <div className="space-y-10 text-center">
                <div className="space-y-2">
                  <h2 className="font-sans text-lg text-foreground">
                    Files, organized by context
                  </h2>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                    Midday automatically tags and sorts your files by company,
                    project and document type. No folders or manual naming
                    needed.
                  </p>
                </div>
              </div>

              {/* Files Organized Illustration */}
              <div className="flex justify-center">
                <Image
                  src="/illustrations/Files-organized.svg"
                  alt="Files Organized by Context"
                  width={400}
                  height={300}
                  className="w-full max-w-md h-auto object-contain"
                  priority
                />
              </div>
            </div>

            {/* Right - Everything searchable */}
            <div className="space-y-12 p-10 relative">
              <div className="space-y-10 text-center">
                <div className="space-y-2">
                  <h2 className="font-sans text-lg text-foreground">
                    Everything searchable
                  </h2>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                    Use natural language to search across all your files, even
                    scanned PDFs and receipts, and Midday finds exactly what you
                    need.
                  </p>
                </div>
              </div>

              {/* Everything Searchable Illustration */}
              <div className="flex justify-center">
                <Image
                  src="/illustrations/Everything-searchable.svg"
                  alt="Everything Searchable"
                  width={400}
                  height={300}
                  className="w-full max-w-md h-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Find anything, instantly Section */}
      <section className="bg-background h-[875px] relative overflow-hidden flex items-center justify-center">
        {/* Background Image */}
        <div
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            backgroundImage: "url('/illustrations/Search-background.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />

        <div className="relative z-10 max-w-[800px] mx-auto px-8">
          <div className="space-y-10 text-center">
            {/* Title and Subtitle */}
            <div className="space-y-3">
              <h2 className="font-serif text-3xl text-foreground">
                Find anything, instantly
              </h2>
              <p className="font-sans text-sm text-muted-foreground max-w-md mx-auto">
                No more hunting. Instantly surface anything across your entire
                workspace.
              </p>
            </div>

            {/* Search Illustration */}
            <div className="flex justify-center">
              <Image
                src="/illustrations/Search.svg"
                alt="Search Interface"
                width={800}
                height={600}
                className="w-full max-w-2xl h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Time Savings Bento Grid Section */}
      <section className="bg-background py-16 sm:py-24">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="font-serif text-2xl text-foreground">
              Time savings that add up
            </h2>
            <p className="font-sans text-sm text-muted-foreground max-w-2xl mx-auto">
              Cut out the manual reconciliation, filing, and tracking that eats
              up your week.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              <article className="group relative overflow-hidden bg-background border border-border p-4 sm:p-5 hover-bg hover-border transition-all duration-200 cursor-pointer">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center bg-secondary border border-border">
                    <MaterialIcon name="receipt" className="text-muted-foreground" size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs  tracking-wide text-muted-foreground">
                      Receipt matching
                    </p>
                    <h3 className="mt-1 text-base sm:text-lg text-foreground">
                      ~1.5 h saved
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Reconciliation powered by agents, no more manual matching.
                    </p>
                  </div>
                </div>
              </article>

              <article className="group relative overflow-hidden bg-background border border-border p-4 sm:p-5 hover-bg hover-border transition-all duration-200 cursor-pointer">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center bg-secondary border border-border">
                    <MaterialIcon name="label" className="text-muted-foreground" size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs  tracking-wide text-muted-foreground">
                      Transaction tagging
                    </p>
                    <h3 className="mt-1 text-base sm:text-lg text-foreground">
                      ~1 h saved
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Auto‑categorization with explainable rules & insights.
                    </p>
                  </div>
                </div>
              </article>

              <article className="group relative overflow-hidden bg-background border border-border p-4 sm:p-5 hover-bg hover-border transition-all duration-200 cursor-pointer hidden xl:block">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center bg-secondary border border-border">
                    <MaterialIcon name="request_quote" className="text-muted-foreground" size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs  tracking-wide text-muted-foreground">
                      Invoices
                    </p>
                    <h3 className="mt-1 text-base sm:text-lg text-foreground">
                      ~1.5–2 h saved
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Fast, connected invoicing—from draft to paid.
                    </p>
                  </div>
                </div>
              </article>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-10 gap-3 sm:gap-4">
              <article className="group relative overflow-hidden bg-background border border-border p-4 sm:p-5 hover-bg hover-border transition-all duration-200 cursor-pointer xl:col-span-3">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center bg-secondary border border-border">
                    <MaterialIcon name="folder" className="text-muted-foreground" size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs  tracking-wide text-muted-foreground">
                      Inbox & files
                    </p>
                    <h3 className="mt-1 text-base sm:text-lg text-foreground">
                      ~1–1.5 h saved
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Organized, searchable storage across receipts and docs.
                    </p>
                  </div>
                </div>
              </article>

              <article className="group relative overflow-hidden bg-background border border-border p-4 sm:p-5 hover-bg hover-border transition-all duration-200 cursor-pointer xl:hidden">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center bg-secondary border border-border">
                    <MaterialIcon name="request_quote" className="text-muted-foreground" size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs  tracking-wide text-muted-foreground">
                      Invoices
                    </p>
                    <h3 className="mt-1 text-base sm:text-lg text-foreground">
                      ~1.5–2 h saved
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Fast, connected invoicing—from draft to paid.
                    </p>
                  </div>
                </div>
              </article>

              <article
                onClick={() => router.push('/login')}
                className="relative overflow-hidden bg-secondary border border-border p-4 sm:p-5 md:p-5 lg:p-6 transition-all duration-200 cursor-pointer group hidden xl:block xl:col-span-7 hover:border-muted-foreground"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs tracking-wide/loose text-muted-foreground transition-colors duration-200">
                      Time savings
                    </p>
                    <p className="mt-1 text-base sm:text-lg text-foreground transition-colors duration-200">
                      Get your time back
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground transition-colors duration-200">
                      <span className="group-hover:hidden transition-opacity duration-200">
                        Less admin means fewer late nights and more space for
                        the work that actually matters.
                      </span>
                      <span className="hidden group-hover:inline transition-opacity duration-200">
                        Meet your assistant and see how it works.
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-4xl sm:text-5xl text-foreground transition-colors duration-200">
                      4-6h
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 transition-colors duration-200">
                      saved per week
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-8">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* Testimonials Section */}
      <section className="bg-background">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-8 py-16 sm:py-24">
          <div className="flex flex-col gap-4 items-center">
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

            {/* Desktop Testimonials Grid */}
            <div className="hidden lg:flex gap-3 w-full max-w-5xl mt-6 justify-center">
              {testimonials.map((testimonial, index) => (
                <MorphingDialog key={index}>
                  <MorphingDialogTrigger
                    className={`flex-shrink-0 group ${
                      index === 0
                        ? 'transform -rotate-1'
                        : index === 1
                          ? 'transform rotate-1'
                          : index === 2
                            ? 'transform rotate-2'
                            : ''
                    }`}
                  >
                    <div className="bg-background border border-border p-6 w-64 flex flex-col gap-4 transition-all duration-200 hover:border-muted-foreground">
                      <div className="flex gap-2 items-center">
                        <div className="w-4 h-4 bg-muted rounded-full"></div>
                        <MorphingDialogTitle className="font-sans text-sm text-foreground">
                          {testimonial.name}
                        </MorphingDialogTitle>
                      </div>
                      <div className="flex flex-col gap-2 text-left">
                        <MorphingDialogSubtitle className="font-sans text-xs text-muted-foreground">
                          {testimonial.title}
                        </MorphingDialogSubtitle>
                        <div className="font-sans text-sm text-muted-foreground leading-relaxed">
                          &quot;{testimonial.content}&quot;
                        </div>
                      </div>
                    </div>
                  </MorphingDialogTrigger>

                  <MorphingDialogContainer>
                    <MorphingDialogContent
                      className="bg-background border border-border p-8 max-w-2xl"
                    >
                      <MorphingDialogClose className="text-muted-foreground hover:text-foreground" />

                      <div className="flex flex-col gap-6">
                        <div className="flex gap-3 items-center">
                          <div className="w-6 h-6 bg-muted rounded-full"></div>
                          <div className="flex flex-col">
                            <MorphingDialogTitle className="font-sans text-sm text-foreground">
                              {testimonial.name}
                            </MorphingDialogTitle>
                            <MorphingDialogSubtitle className="font-sans text-sm text-muted-foreground">
                              {testimonial.title}
                            </MorphingDialogSubtitle>
                          </div>
                        </div>

                        <MorphingDialogDescription
                          disableLayoutAnimation
                          variants={{
                            initial: { opacity: 0, scale: 0.8, y: 100 },
                            animate: { opacity: 1, scale: 1, y: 0 },
                            exit: { opacity: 0, scale: 0.8, y: 100 },
                          }}
                          className="font-sans text-sm text-muted-foreground leading-relaxed whitespace-pre-line"
                        >
                          &quot;{testimonial.fullContent}&quot;
                        </MorphingDialogDescription>
                      </div>
                    </MorphingDialogContent>
                  </MorphingDialogContainer>
                </MorphingDialog>
              ))}
            </div>

            {/* Mobile Carousel */}
            <div className="lg:hidden w-full max-w-sm mt-4 mx-auto">
              <div className="relative overflow-hidden mb-4">
                <motion.div
                  className="flex cursor-grab active:cursor-grabbing"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragMomentum={false}
                  style={{ x: dragX }}
                  animate={{ translateX: `-${currentSlide * 100}%` }}
                  onDragEnd={() => {
                    const x = dragX.get()

                    if (x <= -50 && currentSlide < testimonials.length - 1) {
                      setCurrentSlide(currentSlide + 1)
                    } else if (x >= 50 && currentSlide > 0) {
                      setCurrentSlide(currentSlide - 1)
                    }
                  }}
                  transition={{
                    damping: 18,
                    stiffness: 90,
                    type: 'spring',
                    duration: 0.2,
                  }}
                >
                  {testimonials.map((testimonial, index) => (
                    <div key={index} className="w-full flex-shrink-0">
                      <MorphingDialog>
                        <MorphingDialogTrigger className="w-full">
                          <div className="bg-background border border-border p-6 flex flex-col gap-4 select-none hover:border-muted-foreground transition-all duration-200">
                            <div className="flex gap-2 items-center">
                              <div className="w-4 h-4 bg-muted rounded-full"></div>
                              <MorphingDialogTitle className="font-sans text-sm text-foreground">
                                {testimonial.name}
                              </MorphingDialogTitle>
                            </div>
                            <div className="flex flex-col gap-2 text-left">
                              <MorphingDialogSubtitle className="font-sans text-sm text-muted-foreground">
                                {testimonial.title}
                              </MorphingDialogSubtitle>
                              <div className="font-sans text-sm text-muted-foreground leading-relaxed">
                                &quot;{testimonial.content}&quot;
                              </div>
                            </div>
                          </div>
                        </MorphingDialogTrigger>

                        <MorphingDialogContainer>
                          <MorphingDialogContent className="bg-background border border-border p-8 max-w-2xl">
                            <MorphingDialogClose className="text-muted-foreground hover:text-foreground" />

                            <div className="flex flex-col gap-6">
                              <div className="flex gap-3 items-center">
                                <div className="w-6 h-6 bg-muted rounded-full"></div>
                                <div className="flex flex-col">
                                  <MorphingDialogTitle className="font-sans text-sm text-foreground">
                                    {testimonial.name}
                                  </MorphingDialogTitle>
                                  <MorphingDialogSubtitle className="font-sans text-sm text-muted-foreground">
                                    {testimonial.title}
                                  </MorphingDialogSubtitle>
                                </div>
                              </div>

                              <MorphingDialogDescription
                                disableLayoutAnimation
                                variants={{
                                  initial: { opacity: 0, scale: 0.8, y: 100 },
                                  animate: { opacity: 1, scale: 1, y: 0 },
                                  exit: { opacity: 0, scale: 0.8, y: 100 },
                                }}
                                className="font-sans text-sm text-muted-foreground leading-relaxed whitespace-pre-line"
                              >
                                &quot;{testimonial.fullContent}&quot;
                              </MorphingDialogDescription>
                            </div>
                          </MorphingDialogContent>
                        </MorphingDialogContainer>
                      </MorphingDialog>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

