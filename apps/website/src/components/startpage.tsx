'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, useInView } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { Button } from '@midday/ui/button'
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
import { AIAssistantAnimation } from './homepage/ai-assistant-animation'
import { InvoicePromptAnimation } from './homepage/invoice-prompt-animation'
import { InboxMatchAnimation } from './homepage/inbox-match-animation'
import { FileGridAnimation } from './homepage/file-grid-animation'
import { MaterialIcon, IconMap } from './homepage/icon-mapping'

export function StartPage() {
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [activeFeature, setActiveFeature] = useState(0)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>(
    'yearly',
  )
  const [mounted, setMounted] = useState(false)
  const dragX = useMotionValue(0)
  const { resolvedTheme } = useTheme()
  
  // Prevent hydration mismatch by only using theme after mount
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Always use light mode during SSR to prevent hydration mismatch
  // Only use actual theme after component has mounted on client
  const isLightMode = mounted && resolvedTheme ? resolvedTheme !== 'dark' : true

  const videoContainerRef = useRef(null)
  const isVideoInView = useInView(videoContainerRef, { once: true })

  const features = [
    {
      title: 'Your financial co-pilot',
      subtitle:
        'Your assistant keeps you informed with real-time insights, timely nudges and helpful reminders so you stay in control without the noise.',
      mergedText:
        'Your financial co-pilot keeps you informed with real-time insights, timely nudges and helpful reminders so you stay in control without the noise.',
      illustration: 'animation',
    },
    {
      title: 'Auto-matched receipts from Gmail',
      subtitle:
        'Auto-matched receipts from Gmail are automatically pulled and matched to the right transactions, helping you save time and money.',
      mergedText:
        'Auto-matched receipts from Gmail are automatically pulled and matched to the right transactions, helping you save time and money.',
      illustration: '/illustrations/Mail.svg',
    },
    {
      title: 'Actions, not just answers',
      subtitle:
        'Ask the assistant to send an invoice, track time, create reports, or organize files. Behind the scenes, agents handle the busywork while you keep moving.',
      mergedText:
        'Actions, not just answers as you can ask the assistant to send an invoice, track time, create reports, or organize files while agents handle the busywork behind the scenes so you can keep moving.',
      illustration: '/illustrations/Actions.svg',
    },
    {
      title: 'Files are tagged and always findable',
      subtitle:
        'Agents automatically tag, sort and link your files behind the scenes so everything is always in the right place without you lifting a finger.',
      mergedText:
        'Files are tagged and always findable as Files-agent automatically tags, sorts, and links them behind the scenes so everything stays in the right place without you lifting a finger.',
      illustration: '/illustrations/Files.svg',
    },
  ]

  const agentTags: Array<{ label: string; icon: string }> = [
    { label: 'Insights-agent', icon: 'insights' },
    { label: 'Inbox-agent', icon: 'inbox' },
    { label: 'Invoice-agent', icon: 'description' },
    { label: 'Files-agent', icon: 'folder_zip' },
  ]

  const testimonials = [
    {
      name: 'Sarah Chen',
      title: 'Freelance Designer',
      content:
        'Midday transformed my freelance business. No more scattered receipts or manual tracking. Everything organized automatically, saving me 3+ hours every week.',
      fullContent:
        'Midday transformed how I manage my freelance business. No more scattered receipts or manual invoice tracking. Everything is organized automatically, saving me 3+ hours every week.\n\nAs a freelance designer working with multiple clients, I used to spend hours every week organizing receipts, categorizing expenses, and manually entering data into spreadsheets. It was tedious and error-prone.\n\nWith Midday, everything happens automatically. When I upload a receipt, it\'s instantly categorized and linked to the right project. The AI even extracts vendor information and matches it with my existing contacts. The time I used to spend on admin work, I now spend on actual design work for my clients.\n\nThe search functionality is incredible too. I can type \'office supplies March\' and instantly find all related expenses. It\'s like having a personal assistant who never forgets anything.',
    },
    {
      name: 'Marcus Rodriguez',
      title: 'Restaurant Owner',
      content:
        'Tracking expenses was a nightmare. Midday\'s AI automatically categorizes everything from ingredients to equipment repairs. Game changer!',
      fullContent:
        'As a restaurant owner, tracking expenses was a nightmare. Midday\'s AI automatically categorizes everything from ingredient purchases to equipment repairs. Game changer!\n\nRunning a restaurant means dealing with dozens of vendors, daily ingredient purchases, equipment maintenance, and staff expenses. Before Midday, I had boxes of receipts and no clear picture of where my money was going.\n\nNow, every receipt gets scanned and categorized automatically. Food costs, equipment repairs, utilities - everything is organized without me lifting a finger. The insights dashboard shows me exactly where I\'m spending too much and where I can optimize.\n\nLast month, I discovered I was overpaying for produce by 15% because Midday highlighted pricing patterns across different suppliers. That insight alone saved me more than the software costs for the entire year.',
    },
    {
      name: 'Emily Watson',
      title: 'Startup Founder',
      content:
        'Juggling countless expenses as a startup founder. Midday\'s smart organization and automated reconciliation let me focus on building, not bookkeeping.',
      fullContent:
        'Running a tech startup means juggling countless expenses. Midday\'s smart file organization and automated reconciliation let me focus on building, not bookkeeping.\n\nAs a startup founder, every minute counts. I need to focus on product development, customer acquisition, and fundraising - not sorting through receipts and matching bank transactions.\n\nMidday\'s automated reconciliation is a lifesaver. It connects my bank accounts, credit cards, and expense receipts automatically. When I get back from a business trip, all my expenses are already categorized and ready for reimbursement.\n\nThe reporting features help me prepare for investor meetings too. I can generate clean expense reports by category, track burn rate, and identify cost optimization opportunities. It\'s like having a CFO in my pocket, but for a fraction of the cost.',
    },
    {
      name: 'David Kim',
      title: 'Consultant',
      content:
        'Tons of receipts and invoices for client work. Midday\'s natural language search finds any document instantly. \'Show me Q1 expenses for Client X\' - boom, there it is.',
      fullContent:
        'Client work means tons of receipts and invoices. Midday\'s natural language search finds any document instantly. \'Show me Q1 expenses for Client X\' - boom, there it is.\n\nAs an independent consultant working with multiple clients simultaneously, document organization used to be my biggest pain point. Client dinners, travel expenses, software subscriptions - everything needed to be tracked separately for accurate billing.\n\nMidday\'s natural language search is phenomenal. Instead of remembering folder structures or file names, I just describe what I\'m looking for. \'Show me all restaurant expenses for the Johnson project in March\' - and there it is, instantly.\n\nThe client reporting feature automatically generates expense summaries by project. At the end of each month, I can send clean, professional expense reports to my clients with just a few clicks. My clients love the transparency, and I love getting paid faster.',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-background relative min-h-screen overflow-visible lg:overflow-hidden">
        {/* Mobile Layout */}
        <div className="lg:hidden flex flex-col min-h-screen relative px-3 sm:px-4 pt-32 pb-12 sm:py-32 md:pt-24 overflow-hidden">
          <div className="flex-1 flex flex-col justify-center md:justify-start md:pt-16 items-center space-y-8 z-20">
            <div className="space-y-4 text-center max-w-xl px-2">
              <h1 className="font-serif text-2xl sm:text-3xl md:text-3xl lg:text-2xl xl:text-2xl 2xl:text-2xl leading-tight">
                <span className="text-foreground">
                  Give your small business the financial superpowers of a large
                  one.
                </span>
              </h1>

              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed font-sans max-w-md">
                With your AI finance assistant, you get automated reconciliation,
                invoicing, and real-time insights without needing a finance
                team.
              </p>
            </div>

            <div className="space-y-4 text-center">
              <div className="flex flex-col gap-3 max-w-sm">
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full btn-inverse h-11 px-5 transition-colors"
                >
                  <span className="text-inherit text-sm ">
                    Meet your assistant
                  </span>
                </Button>
              </div>

              <p className="text-muted-foreground text-xs font-sans">
                14 day trial (No credit card required)
              </p>
            </div>
          </div>

          <div className="mt-8 mb-8 md:mt-12 overflow-visible">
            <div className="relative overflow-hidden">
              <video
                className="w-full h-[420px] sm:h-[520px] md:h-[600px] object-cover"
                poster="https://pub-842eaa8107354d468d572ebfca43b6e3.r2.dev/video-poster-v2.jpg"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
              >
                <source
                  src="https://pub-842eaa8107354d468d572ebfca43b6e3.r2.dev/videos/login-video.mp4"
                  type="video/mp4"
                />
              </video>

              <div className="absolute inset-0 flex items-center justify-center p-0">
                <div className="relative" style={{ transform: 'scale(0.9)' }}>
                      <Image
                        src={
                          isLightMode
                            ? '/images/dashboard-light.svg'
                            : '/images/dashboard-dark.svg'
                        }
                        alt="Dashboard illustration"
                        width={1000}
                        height={750}
                        className="w-full h-auto md:!scale-[1.7] 2xl:!scale-[1.2]"
                        priority
                      />
                </div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <button className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-200 pointer-events-auto">
                  <MaterialIcon name="play_arrow" className="text-foreground" size={24} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex flex-col min-h-screen relative">
          <div className="max-w-[1400px] mx-auto w-full">
            <div className="pt-56 mb-16">
              <div className="flex justify-between items-end">
                <div className="max-w-xl">
                  <div className="space-y-3">
                    <h1 className="font-serif text-xl lg:text-2xl xl:text-3xl 2xl:text-3xl leading-tight lg:leading-[1.6] xl:leading-[1.3] text-left">
                      <span className="text-foreground">
                        Give your small business the financial superpowers of a
                        large one.
                      </span>
                    </h1>
                    <p className="font-sans text-sm text-muted-foreground leading-relaxed text-left">
                      With your AI finance assistant, you get automated
                      reconciliation, invoicing, and real-time insights without
                      needing a finance team.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => router.push('/login')}
                      className="btn-inverse h-11 px-4 transition-colors"
                    >
                      <span className="text-inherit text-sm ">
                        Meet your assistant
                      </span>
                    </Button>
                  </div>

                  <div className="text-right">
                    <p className="text-muted-foreground text-xs font-sans">
                      14 day trial (No credit card required)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full mb-4 relative" ref={videoContainerRef}>
            <div className="relative overflow-hidden">
              <video
                className="w-full h-[800px] xl:h-[900px] object-cover block"
                poster="https://pub-842eaa8107354d468d572ebfca43b6e3.r2.dev/video-poster-v2.jpg"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
              >
                <source
                  src="https://pub-842eaa8107354d468d572ebfca43b6e3.r2.dev/videos/login-video.mp4"
                  type="video/mp4"
                />
              </video>

              <div className="absolute inset-0 p-4">
                <div className="h-full flex flex-col items-center justify-center">
                      <Image
                        src={
                          isLightMode
                            ? '/images/dashboard-light.svg'
                            : '/images/dashboard-dark.svg'
                        }
                        alt="Dashboard illustration"
                        width={1600}
                        height={1200}
                        className="w-full h-auto object-contain max-w-[85%] 2xl:max-w-[66%]"
                        style={{
                          transform: 'rotate(-2deg) skew-y-1',
                          filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.6))',
                        }}
                        priority
                      />
                </div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <button className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-200 pointer-events-auto">
                  <MaterialIcon name="play_arrow" className="text-foreground" size={30} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features 2-Column Layout Section */}
      <section className="bg-background pt-8 pb-20">
        <div className="max-w-[1400px] mx-auto">
          {/* Mobile: Stacked features */}
          <div className="grid grid-cols-1 gap-16 lg:hidden">
            {features.map((feature, index) => (
              <div key={index} className="space-y-6">
                <div className="space-y-2 text-center">
                  <h3 className="font-sans text-lg text-foreground max-w-md mx-auto">
                    {feature.title}
                  </h3>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                    {feature.subtitle}
                  </p>
                </div>
                <div className="w-full border border-border overflow-hidden p-1 sm:p-3">
                  <div className="w-full h-[520px] sm:h-[620px] relative overflow-hidden flex items-center justify-center">
                    <div className="w-full h-full origin-center scale-[0.87] sm:scale-[0.9]">
                      {feature.illustration === 'animation' ? (
                        <AIAssistantAnimation onComplete={undefined} />
                      ) : index === 1 ? (
                        <InboxMatchAnimation onComplete={undefined} />
                      ) : index === 2 ? (
                        <InvoicePromptAnimation onComplete={undefined} />
                      ) : index === 3 ? (
                        <FileGridAnimation onComplete={undefined} />
                      ) : (
                        <Image
                          src={feature.illustration}
                          alt={feature.title}
                          width={600}
                          height={450}
                          className="w-full h-full object-contain"
                          priority
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Two-column interactive list + canvas */}
          <div className="hidden lg:grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 lg:h-[740px]">
            <div className="flex flex-col justify-center space-y-8 lg:space-y-12">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`cursor-pointer transition-all duration-300 ${
                    activeFeature === index
                      ? 'opacity-100'
                      : 'opacity-60 hover:opacity-80'
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  {activeFeature === index ? (
                    <motion.div
                      initial={{ opacity: 0, filter: 'blur(6px)' }}
                      animate={{ opacity: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, filter: 'blur(6px)' }}
                      transition={{ duration: 0.35 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-1 pl-2 pr-2 h-6 rounded-full border border-border bg-secondary mb-3 w-fit">
                        <MaterialIcon
                          name={agentTags[index]?.icon as keyof typeof IconMap}
                          className="text-muted-foreground"
                          size={12}
                        />
                        <span className="text-[12px] text-foreground">
                          {agentTags[index]?.label}
                        </span>
                      </div>
                      <h2 className="font-sans text-lg lg:text-xl text-foreground transition-colors duration-300 max-w-md">
                        {feature.title}
                      </h2>
                      <p className="font-sans text-sm text-muted-foreground leading-relaxed max-w-md mt-1">
                        {feature.subtitle}
                      </p>
                    </motion.div>
                  ) : (
                    <div>
                      <h2 className="font-sans text-lg lg:text-xl text-foreground transition-colors duration-300 max-w-md">
                        {feature.title}
                      </h2>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center p-6 lg:p-8 border border-border h-full overflow-hidden">
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className={`w-[400px] h-[500px] sm:w-[520px] sm:h-[640px] lg:w-[600px] lg:h-[700px] relative overflow-hidden ${
                  activeFeature === 2 ? 'scale-[0.96] lg:scale-[0.94]' : ''
                }`}
                style={{ transformOrigin: 'center' }}
              >
                {features[activeFeature].illustration === 'animation' ? (
                  <AIAssistantAnimation
                    onComplete={() =>
                      setActiveFeature((prev) => (prev + 1) % features.length)
                    }
                  />
                ) : activeFeature === 1 ? (
                  <InboxMatchAnimation
                    onComplete={() =>
                      setActiveFeature((prev) => (prev + 1) % features.length)
                    }
                  />
                ) : activeFeature === 2 ? (
                  <InvoicePromptAnimation
                    onComplete={() =>
                      setActiveFeature((prev) => (prev + 1) % features.length)
                    }
                  />
                ) : activeFeature === 3 ? (
                  <FileGridAnimation
                    onComplete={() =>
                      setActiveFeature((prev) => (prev + 1) % features.length)
                    }
                  />
                ) : (
                  <Image
                    src={features[activeFeature].illustration}
                    alt={features[activeFeature].title}
                    width={600}
                    height={450}
                    className="w-full h-full object-contain"
                    priority
                  />
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-8">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* Assistant Features Overview Section */}
      <section className="bg-background py-16 sm:py-24">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-8">
          <div className="text-center space-y-4 mb-12 sm:mb-16">
            <h2 className="font-serif text-xl sm:text-2xl text-foreground">
              The assistant that ties it together
            </h2>
            <p className="font-sans text-sm text-muted-foreground max-w-2xl mx-auto px-4">
              Invoices, receipts, clients, transactions, time and files aren't
              scattered. Your assistant connects them all, keeping everything in
              one place and working together.
            </p>
          </div>

          <div className="flex flex-col gap-8 sm:gap-10 max-w-sm sm:max-w-none mx-auto">
            <div className="grid grid-cols-2 gap-6 sm:flex sm:justify-center sm:gap-20">
              <div className="flex flex-col items-center w-full sm:w-[150px]">
                <div className="bg-secondary border border-border w-[60px] h-[60px] flex items-center justify-center rounded-none mb-4 hover-border transition-all duration-200 cursor-pointer">
                  <MaterialIcon name="widgets" className="text-muted-foreground " size={24} />
                </div>
                <div className="flex flex-col items-center text-center">
                  <h3 className="font-sans text-sm text-foreground leading-[21px]">
                    Assistant
                  </h3>
                  <p className="font-sans text-sm text-muted-foreground leading-[21px]">
                    Daily help
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center w-full sm:w-[150px]">
                <div className="bg-secondary border border-border w-[60px] h-[60px] flex items-center justify-center rounded-none mb-4 hover-border transition-all duration-200 cursor-pointer">
                  <MaterialIcon name="trending_up" className="text-muted-foreground " size={24} />
                </div>
                <div className="flex flex-col items-center text-center">
                  <h3 className="font-sans text-sm text-foreground leading-[21px]">
                    Insights
                  </h3>
                  <p className="font-sans text-sm text-muted-foreground leading-[21px]">
                    Business updates
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center w-full sm:w-[150px]">
                <div className="bg-secondary border border-border w-[60px] h-[60px] flex items-center justify-center rounded-none mb-4 hover-border transition-all duration-200 cursor-pointer">
                  <MaterialIcon name="list_alt" className="text-muted-foreground " size={24} />
                </div>
                <div className="flex flex-col items-center text-center">
                  <h3 className="font-sans text-sm text-foreground leading-[21px]">
                    Transactions
                  </h3>
                  <p className="font-sans text-sm text-muted-foreground leading-[21px]">
                    Smart records
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center w-full sm:w-[150px]">
                <div className="bg-secondary border border-border w-[60px] h-[60px] flex items-center justify-center rounded-none mb-4 hover-border transition-all duration-200 cursor-pointer">
                  <MaterialIcon name="inbox" className="text-muted-foreground " size={24} />
                </div>
                <div className="flex flex-col items-center text-center">
                  <h3 className="font-sans text-sm text-foreground leading-[21px]">
                    Inbox
                  </h3>
                  <p className="font-sans text-sm text-muted-foreground leading-[21px]">
                    Document match
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 sm:flex sm:justify-center sm:gap-20">
              <div className="flex flex-col items-center w-full sm:w-[150px]">
                <div className="bg-secondary border border-border w-[60px] h-[60px] flex items-center justify-center rounded-none mb-4 hover-border transition-all duration-200 cursor-pointer">
                  <MaterialIcon name="timer" className="text-muted-foreground " size={24} />
                </div>
                <div className="flex flex-col items-center text-center">
                  <h3 className="font-sans text-sm text-foreground leading-[21px]">
                    Time tracker
                  </h3>
                  <p className="font-sans text-sm text-muted-foreground leading-[21px]">
                    Track projects
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center w-full sm:w-[150px]">
                <div className="bg-secondary border border-border w-[60px] h-[60px] flex items-center justify-center rounded-none mb-4 hover-border transition-all duration-200 cursor-pointer">
                  <MaterialIcon name="description" className="text-muted-foreground " size={24} />
                </div>
                <div className="flex flex-col items-center text-center">
                  <h3 className="font-sans text-sm text-foreground leading-[21px]">
                    Invoice
                  </h3>
                  <p className="font-sans text-sm text-muted-foreground leading-[21px]">
                    Quick billing
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center w-full sm:w-[150px]">
                <div className="bg-secondary border border-border w-[60px] h-[60px] flex items-center justify-center rounded-none mb-4 hover-border transition-all duration-200 cursor-pointer">
                  <MaterialIcon name="scatter_plot" className="text-muted-foreground " size={24} />
                </div>
                <div className="flex flex-col items-center text-center">
                  <h3 className="font-sans text-sm text-foreground leading-[21px]">
                    Customers
                  </h3>
                  <p className="font-sans text-sm text-muted-foreground leading-[21px]">
                    Client overview
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center w-full sm:w-[150px]">
                <div className="bg-secondary border border-border w-[60px] h-[60px] flex items-center justify-center rounded-none mb-4 hover:border-muted-foreground transition-all duration-200 cursor-pointer">
                  <MaterialIcon name="folder_zip" className="text-muted-foreground " size={24} />
                </div>
                <div className="flex flex-col items-center text-center">
                  <h3 className="font-sans text-sm text-foreground leading-[21px]">
                    File storage
                  </h3>
                  <p className="font-sans text-sm text-muted-foreground leading-[21px]">
                    Organized files
                  </p>
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

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-8">
        <div className="h-px w-full border-t border-border" />
      </div>

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
              <article
                onClick={() => router.push('/file-storage')}
                className="group relative overflow-hidden bg-background border border-border p-4 sm:p-5 hover-bg hover-border transition-all duration-200 cursor-pointer xl:col-span-3"
              >
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

            <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:hidden">
              <article
                onClick={() => router.push('/login')}
                className="relative overflow-hidden bg-secondary border border-border p-4 sm:p-5 md:p-5 lg:p-6 transition-all duration-200 cursor-pointer group hover:border-muted-foreground"
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

      {/* Pre-accounting Features Section */}
      <section className="bg-background py-16 sm:py-24">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-8">
          <div className="text-center space-y-4 mb-16">
            <div className="h-[100px] w-28 mx-auto mb-8">
              <Image
                src={
                  isLightMode
                    ? '/images/accounting-light.png'
                    : '/images/accounting-dark.png'
                }
                alt="Accounting Icon"
                width={112}
                height={100}
                className="w-full h-full object-contain rounded-none"
              />
            </div>
            <h2 className="font-serif text-2xl text-foreground">
              Pre-accounting made simple
            </h2>
            <p className="font-sans text-sm text-muted-foreground max-w-2xl mx-auto">
              Midday connects your inbox, transactions and search to match
              receipts and invoices automatically, saving hours, cutting costs
              and doing it all without the accounting bloat.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-secondary border border-border p-6 relative">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MaterialIcon name="check" className="text-foreground" size={16} />
                  <span className="font-sans text-sm text-foreground">
                    Auto-categorize transactions
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <MaterialIcon name="check" className="text-foreground" size={16} />
                  <span className="font-sans text-sm text-foreground">
                    Gmail connect receipt sync
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <MaterialIcon name="check" className="text-foreground" size={16} />
                  <span className="font-sans text-sm text-foreground">
                    Auto-match receipts to transactions
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <MaterialIcon name="check" className="text-foreground" size={16} />
                  <span className="font-sans text-sm text-foreground">
                    Add subcategories for better reporting
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <MaterialIcon name="check" className="text-foreground" size={16} />
                  <span className="font-sans text-sm text-foreground">
                    Assign tax type and rates automatically
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <MaterialIcon name="check" className="text-foreground" size={16} />
                  <span className="font-sans text-sm text-foreground">
                    Track VAT, sales tax or GST by transaction
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <MaterialIcon name="check" className="text-foreground" size={16} />
                  <span className="font-sans text-sm text-foreground">
                    Reconcile and export in one click
                  </span>
                </div>
              </div>

              <div className="flex justify-start mt-4 sm:absolute sm:bottom-6 sm:right-6 sm:mt-0">
                <span className="font-sans text-sm text-muted-foreground underline">
                  Learn more
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-8">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* Pricing Section */}
      <section className="bg-background py-20 sm:py-32">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="font-serif text-2xl text-foreground">
              Choose the plan that grows with you
            </h2>
            <p className="font-sans text-sm text-muted-foreground">
              Try any plan free for 14 days, cancel anytime. No credit card
              required.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-16">
            <div
              className="relative flex items-stretch bg-muted"
              style={{ width: 'fit-content' }}
            >
              <div className="flex items-stretch">
                <button
                  onClick={() => setBillingPeriod('yearly')}
                  className={`group relative flex items-center gap-1.5 px-3 py-1.5 h-9 text-[14px] whitespace-nowrap border border-transparent transition-colors ${
                    billingPeriod === 'yearly'
                      ? 'text-foreground bg-secondary'
                      : 'text-muted-foreground hover:text-foreground bg-muted'
                  }`}
                  style={{
                    marginBottom: billingPeriod === 'yearly' ? '-1px' : '0px',
                    position: 'relative',
                    zIndex: billingPeriod === 'yearly' ? 10 : 1,
                  }}
                >
                  <span>Yearly (Save 20%)</span>
                </button>
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`group relative flex items-center gap-1.5 px-3 py-1.5 h-9 text-[14px] whitespace-nowrap border border-transparent transition-colors ${
                    billingPeriod === 'monthly'
                      ? 'text-foreground bg-secondary'
                      : 'text-muted-foreground hover:text-foreground bg-muted'
                  }`}
                  style={{
                    marginBottom: billingPeriod === 'monthly' ? '-1px' : '0px',
                    position: 'relative',
                    zIndex: billingPeriod === 'monthly' ? 10 : 1,
                  }}
                >
                  <span>Monthly</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="flex flex-col lg:flex-row gap-14 justify-center max-w-6xl mx-auto">
            {/* Starter */}
            <div className="flex-1 max-w-md">
              <div className="bg-background backdrop-blur-[43px] border border-border p-4 py-6 h-full flex flex-col">
                <div className="mb-4">
                  <h3 className="font-sans text-base text-foreground mb-1">
                    Starter
                  </h3>
                  <p className="font-sans text-sm text-muted-foreground mb-3">
                    For freelancers & solo operators
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="font-sans text-2xl text-foreground">
                      {billingPeriod === 'monthly' ? '$29' : '$23'}
                    </span>
                    <span className="font-sans text-sm text-muted-foreground">
                      /mo
                    </span>
                  </div>
                  <p className="font-sans text-xs text-muted-foreground mt-1">
                    {billingPeriod === 'monthly'
                      ? 'When billed monthly'
                      : 'When billed yearly'}
                  </p>
                </div>

                <div className="flex-1 space-y-1 border-t border-border pt-8 pb-6">
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="check" className="text-foreground" size={16} />
                    <span className="font-sans text-sm text-foreground">
                      2 user
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="check" className="text-foreground" size={16} />
                    <span className="font-sans text-sm text-foreground">
                      Email support
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="check" className="text-foreground" size={16} />
                    <span className="font-sans text-sm text-foreground">
                      Assistant: limited usage
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="check" className="text-foreground" size={16} />
                    <span className="font-sans text-sm text-foreground">
                      Standard reports (expenses + receipts overview)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="check" className="text-foreground" size={16} />
                    <span className="font-sans text-sm text-foreground">
                      Up to 5 invoices / month
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="check" className="text-foreground" size={16} />
                    <span className="font-sans text-sm text-foreground">
                      Up to 50 inbox items / month
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="check" className="text-foreground" size={16} />
                    <span className="font-sans text-sm text-foreground">
                      File storage: 2GB
                    </span>
                  </div>
                </div>

                <Button className="w-full bg-background border border-border text-foreground font-sans text-sm py-3 px-4 hover:bg-muted transition-colors">
                  Start free trial
                </Button>
              </div>
            </div>

            {/* Pro */}
            <div className="flex-1 max-w-md">
              <div className="bg-background backdrop-blur-[43px] border border-border p-4 py-6 h-full flex flex-col">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-sans text-base text-foreground">
                      Pro
                    </h3>
                    <div className="bg-background border border-border px-2 py-1 rounded-full flex items-center justify-center">
                      <span className="font-sans text-xs text-muted-foreground">
                        Most Popular
                      </span>
                    </div>
                  </div>
                  <p className="font-sans text-sm text-muted-foreground mb-3">
                    For small teams & startups
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="font-sans text-2xl text-foreground">
                      {billingPeriod === 'monthly' ? '$49' : '$39'}
                    </span>
                    <span className="font-sans text-sm text-muted-foreground">
                      /mo
                    </span>
                  </div>
                  <p className="font-sans text-xs text-muted-foreground mt-1">
                    {billingPeriod === 'monthly'
                      ? 'When billed monthly'
                      : 'When billed yearly'}
                  </p>
                </div>

                <div className="flex-1 space-y-1 border-t border-border pt-8 pb-6">
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="check" className="text-foreground" size={16} />
                    <span className="font-sans text-sm text-foreground">
                      Up to 5 users
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="check" className="text-foreground" size={16} />
                    <span className="font-sans text-sm text-foreground">
                      Email + Slack support
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="check" className="text-foreground" size={16} />
                    <span className="font-sans text-sm text-foreground">
                      Assistant: extended usage
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="check" className="text-foreground" size={16} />
                    <span className="font-sans text-sm text-foreground">
                      Advanced reports (multi-currency & trends)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="check" className="text-foreground" size={16} />
                    <span className="font-sans text-sm text-foreground">
                      Up to 50 invoices / month
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="check" className="text-foreground" size={16} />
                    <span className="font-sans text-sm text-foreground">
                      Up to 1,000 inbox items / month
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="check" className="text-foreground" size={16} />
                    <span className="font-sans text-sm text-foreground">
                      File storage: 20GB
                    </span>
                  </div>
                </div>

                <Button className="w-full btn-inverse font-sans  text-sm py-3 px-4 transition-colors">
                  Start free trial
                </Button>
              </div>
            </div>

            {/* Max */}
            <div className="flex-1 max-w-md">
              <div className="bg-background backdrop-blur-[43px] border border-border p-4 py-6 h-full flex flex-col">
                <div className="mb-4">
                  <h3 className="font-sans text-base text-foreground mb-1">
                    Max
                  </h3>
                  <p className="font-sans text-sm text-muted-foreground mb-3">
                    For scaling companies & SMBs
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="font-sans text-2xl text-foreground">
                      {billingPeriod === 'monthly' ? '$99' : '$79'}
                    </span>
                    <span className="font-sans text-sm text-muted-foreground">
                      /mo
                    </span>
                  </div>
                  <p className="font-sans text-xs text-muted-foreground mt-1">
                    {billingPeriod === 'monthly'
                      ? 'When billed monthly'
                      : 'When billed yearly'}
                  </p>
                </div>

                <div className="flex-1 space-y-1 border-t border-border pt-8 pb-6">
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="check" className="text-foreground" size={16} />
                    <span className="font-sans text-sm text-foreground">
                      Unlimited users
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="check" className="text-foreground" size={16} />
                    <span className="font-sans text-sm text-foreground">
                      Faster priority support (email + Slack)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="check" className="text-foreground" size={16} />
                    <span className="font-sans text-sm text-foreground">
                      Assistant: unlimited usage
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="check" className="text-foreground" size={16} />
                    <span className="font-sans text-sm text-foreground">
                      Full reporting suite (forecasts & insights)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="check" className="text-foreground" size={16} />
                    <span className="font-sans text-sm text-foreground">
                      Unlimited invoices
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="check" className="text-foreground" size={16} />
                    <span className="font-sans text-sm text-foreground">
                      Unlimited inbox items
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="check" className="text-foreground" size={16} />
                    <span className="font-sans text-sm text-foreground">
                      File storage: 200GB
                    </span>
                  </div>
                </div>

                <Button className="w-full bg-background border border-border text-foreground font-sans text-sm py-3 px-4 hover:bg-muted transition-colors">
                  Start free trial
                </Button>
              </div>
            </div>
          </div>

          <div className="text-center mt-16">
            <p className="font-sans text-xs text-muted-foreground">
              All prices in USD. Local taxes (VAT, GST, or sales tax) may be
              added at checkout.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
