'use client'

import { useState, useRef } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContainer,
  MorphingDialogContent,
  MorphingDialogClose,
  MorphingDialogTitle,
  MorphingDialogSubtitle,
  MorphingDialogDescription,
} from '../motion-primitives/morphing-dialog'
import { MaterialIcon } from '../homepage/icon-mapping'

export interface Testimonial {
  name: string
  title: string
  content: string
  fullContent: string
}

interface TestimonialsSectionProps {
  testimonials?: Testimonial[]
  title?: string
  subtitle?: string
  showStars?: boolean
  customHeader?: ReactNode
}

const defaultTestimonials: Testimonial[] = [
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

export function TestimonialsSection({
  testimonials = defaultTestimonials,
  title = 'Built alongside our users',
  subtitle = 'For founders and small teams who run their business every week, every feature earns its place in the workflow.',
  showStars = true,
  customHeader,
}: TestimonialsSectionProps) {
  // Start at the center card
  const initialSlide = Math.floor(testimonials.length / 2)
  const [currentSlide, setCurrentSlide] = useState(initialSlide)
  const lastDragDistance = useRef(0)
  const pointerDownRef = useRef<{ time: number; x: number } | null>(null)
  const [shouldBlockClick, setShouldBlockClick] = useState(false)

  return (
    <section className="bg-background">
      <div className="max-w-[1400px] mx-auto py-12 sm:py-16 lg:py-24">
        {customHeader ? (
          customHeader
        ) : (
          <>
            <div className="flex flex-col gap-4 items-center">
              <div className="flex flex-col gap-4 items-center text-center max-w-3xl">
                <h2 className="font-serif text-2xl sm:text-2xl text-foreground">
                  {title}
                </h2>
                <p className="hidden sm:block font-sans text-base text-muted-foreground leading-normal">
                  {subtitle}
                </p>
              </div>

              {showStars && (
                <div className="flex items-center justify-center mb-10">
                  <div className="flex gap-1">
                    <MaterialIcon name="star" className="text-muted-foreground" size={16} />
                    <MaterialIcon name="star" className="text-muted-foreground" size={16} />
                    <MaterialIcon name="star" className="text-muted-foreground" size={16} />
                    <MaterialIcon name="star" className="text-muted-foreground" size={16} />
                    <MaterialIcon name="star_half" className="text-muted-foreground" size={16} />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Desktop Testimonials Grid */}
        <div className="hidden lg:flex gap-3 w-full max-w-5xl mx-auto justify-center">
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
          <div className="lg:hidden w-full max-w-sm mx-auto">
            <div className="relative overflow-visible mb-4 px-4">
              <motion.div
                className="flex gap-4"
                drag="x"
                dragConstraints={{ 
                  left: `-${(testimonials.length - 1) * 89}%`, 
                  right: 0 
                }}
                dragElastic={0.2}
                animate={{ 
                  x: `-${currentSlide * 89}%`,
                }}
                onDragEnd={(_, info) => {
                  const threshold = 50
                  const velocity = info.velocity.x
                  const dragDistance = Math.abs(info.offset.x)
                  
                  // Store drag distance to check in click handler
                  lastDragDistance.current = dragDistance

                  if (velocity < -500 || (info.offset.x < -threshold && currentSlide < testimonials.length - 1)) {
                    setCurrentSlide(Math.min(currentSlide + 1, testimonials.length - 1))
                  } else if (velocity > 500 || (info.offset.x > threshold && currentSlide > 0)) {
                    setCurrentSlide(Math.max(currentSlide - 1, 0))
                  }

                  // Block clicks if there was significant drag
                  if (dragDistance > 15) {
                    setShouldBlockClick(true)
                    setTimeout(() => {
                      setShouldBlockClick(false)
                      lastDragDistance.current = 0
                    }, 300)
                  } else {
                    setTimeout(() => {
                      lastDragDistance.current = 0
                    }, 200)
                  }
                }}
                transition={{
                  type: 'spring',
                  damping: 25,
                  stiffness: 200,
                }}
              >
                {testimonials.map((testimonial, index) => {
                  // Calculate rotation based on position relative to center
                  const centerIndex = Math.floor(testimonials.length / 2)
                  const offset = index - centerIndex
                  let rotation = 0
                  if (offset === -1) rotation = -1
                  else if (offset === 1) rotation = 1
                  else if (offset === -2) rotation = -2
                  else if (offset === 2) rotation = 2
                  
                  return (
                    <div key={index} className="w-[85%] flex-shrink-0">
                      <MorphingDialog>
                        <div
                          onClick={(e) => {
                            // Block click if there was a drag or if we're blocking clicks
                            if (shouldBlockClick || lastDragDistance.current > 15) {
                              e.preventDefault()
                              e.stopPropagation()
                            }
                          }}
                          onPointerDown={(e) => {
                            pointerDownRef.current = {
                              time: Date.now(),
                              x: e.clientX,
                            }
                          }}
                          onPointerUp={(e) => {
                            if (pointerDownRef.current) {
                              const timeDiff = Date.now() - pointerDownRef.current.time
                              const distance = Math.abs(e.clientX - pointerDownRef.current.x)
                              
                              // Block if it was a long press or significant movement
                              if (timeDiff > 200 || distance > 15) {
                                setShouldBlockClick(true)
                                setTimeout(() => {
                                  setShouldBlockClick(false)
                                }, 300)
                              }
                              pointerDownRef.current = null
                            }
                          }}
                        >
                          <MorphingDialogTrigger 
                            className="w-full"
                            style={{ 
                              pointerEvents: shouldBlockClick ? 'none' : 'auto',
                              transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined
                            }}
                          >
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
                        </div>

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
                  )
                })}
              </motion.div>
            </div>
          </div>
      </div>
    </section>
  )
}

