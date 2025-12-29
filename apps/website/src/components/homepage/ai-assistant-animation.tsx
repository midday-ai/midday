'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { InputBar } from '../input-bar'
import { MaterialIcon, IconMap } from './icon-mapping'

export function AIAssistantAnimation({
  onComplete,
}: {
  onComplete?: () => void
}) {
  const { resolvedTheme } = useTheme()
  const isLightMode = resolvedTheme !== 'dark'
  const [showUserMessage, setShowUserMessage] = useState(false)
  const [displayedSegments, setDisplayedSegments] = useState<
    Array<{
      id: number
      text: string
      isComplete: boolean
      showCards?: boolean
    }>
  >([])
  const [activeToolCall, setActiveToolCall] = useState<{
    text: string
    icon: string
  } | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [showCards, setShowCards] = useState(false)
  const [cardsVisible, setCardsVisible] = useState<number[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const cards = [
    {
      icon: 'trending_up',
      title: 'Revenue',
      value: '$4,200',
      change: '+12%',
      changeType: 'positive' as const,
      subtitle: 'vs last week',
    },
    {
      icon: 'trending_down',
      title: 'Expenses',
      value: '$1,800',
      change: '-8%',
      changeType: 'positive' as const,
      subtitle: 'vs last week',
    },
    {
      icon: 'account_balance_wallet',
      title: 'Net Profit',
      value: '$2,400',
      change: '+28%',
      changeType: 'positive' as const,
      subtitle: 'vs last week',
    },
    {
      icon: 'savings',
      title: 'Cash Flow',
      value: '+$1,200',
      change: '+15%',
      changeType: 'positive' as const,
      subtitle: 'this week',
    },
  ]

  const responseSegments = [
    {
      id: 1,
      text: '# Weekly Summary — September 8-14, 2025\n\n## Key Highlights\n\nHere\'s a quick snapshot of your most important metrics this week. Revenue is trending up while expenses are well-controlled, resulting in strong profitability and healthy cash flow.',
      toolCall: {
        text: 'Analyzing financial data',
        icon: 'trending_up',
        duration: 2000,
      },
      showCards: true,
    },
    {
      id: 2,
      text: '## Business Activity\n\nBusiness activity included 8 invoices sent (3 more than last week), 47 hours tracked across projects, $2,800 in forecasted revenue from tracked hours, 23 receipts automatically matched to transactions, and 4 bank transactions categorized automatically.',
      toolCall: {
        text: 'Processing business metrics',
        icon: 'receipt',
        duration: 1600,
      },
    },
  ]

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n')
    const elements: JSX.Element[] = []

    lines.forEach((line, index) => {
      if (line.trim() === '') {
        elements.push(<div key={index} className="h-1" />)
      } else if (line.startsWith('# ')) {
        elements.push(
          <h1
            key={index}
            className="text-[14px]  mb-1 mt-2 first:mt-0 text-foreground"
          >
            {line.slice(2)}
          </h1>,
        )
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2
            key={index}
            className="text-[12px]  mb-1 mt-2 text-foreground"
          >
            {line.slice(3)}
          </h2>,
        )
      } else {
        elements.push(
          <p
            key={index}
            className="text-[12px] leading-[16px] text-foreground"
          >
            {line}
          </p>,
        )
      }
    })
    return elements
  }

  useEffect(() => {
    const startAnimation = () => {
      setShowUserMessage(false)
      setDisplayedSegments([])
      setActiveToolCall(null)
      setIsTyping(false)
      setShowCards(false)
      setCardsVisible([])

      setTimeout(() => {
        setShowUserMessage(true)
      }, 500)

      setTimeout(() => {
        setIsTyping(true)
        processSegments()
      }, 1000)
    }

    const processSegments = () => {
      let segmentIndex = 0

      const processNextSegment = () => {
        if (segmentIndex >= responseSegments.length) {
          setIsTyping(false)
          return
        }

        const segment = responseSegments[segmentIndex]
        const words = segment.text.split(' ')
        let wordIndex = 0

        const typeWords = () => {
          if (wordIndex < words.length) {
            const currentText = words.slice(0, wordIndex + 1).join(' ')
            setDisplayedSegments((prev) => [
              ...prev.slice(0, segmentIndex),
              {
                id: segment.id,
                text: currentText,
                isComplete: false,
                showCards: segment.showCards,
              },
            ])
            wordIndex++
            setTimeout(typeWords, 30)
          } else {
            setDisplayedSegments((prev) => [
              ...prev.slice(0, segmentIndex),
              {
                id: segment.id,
                text: segment.text,
                isComplete: true,
                showCards: segment.showCards,
              },
            ])

            if (segment.toolCall) {
              setActiveToolCall(segment.toolCall)
              setTimeout(() => {
                setActiveToolCall(null)
                segmentIndex++
                setTimeout(processNextSegment, 200)
              }, segment.toolCall.duration)
            } else {
              segmentIndex++
              setTimeout(processNextSegment, 200)
            }
          }
        }

        typeWords()
      }

      processNextSegment()
    }

    startAnimation()

    const completionTimer = setInterval(() => {
      onComplete?.()
    }, 12000)
    const interval = setInterval(startAnimation, 12000)

    return () => {
      clearInterval(interval)
      clearInterval(completionTimer)
    }
  }, [onComplete])

  useEffect(() => {
    if (
      displayedSegments.length > 0 &&
      displayedSegments[0]?.isComplete &&
      displayedSegments[0]?.showCards
    ) {
      setShowCards(true)
      cards.forEach((_, cardIndex) => {
        setTimeout(() => {
          setCardsVisible((prev) => [...prev, cardIndex])
        }, cardIndex * 150)
      })
    }
  }, [displayedSegments])

  return (
    <div className="w-full h-full bg-background flex flex-col relative">
      <div className="flex-1 px-3 py-3 overflow-hidden">
        <div className="space-y-2 h-full flex flex-col">
          <div className="flex justify-end">
            <div
              className={`px-2 py-1 max-w-xs rounded-bl-[100px] rounded-tl-[100px] bg-secondary transition-opacity duration-75 ease-out ${
                showUserMessage ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <p className="text-[12px] text-right text-foreground">
                Show me weekly summary
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {displayedSegments.length === 0 && isTyping && (
              <div className="flex justify-start">
                <div className="flex flex-col max-w-full w-full">
                  <div className="text-[12px] leading-[16px]  animate-shimmer text-foreground">
                    Processing invoices and time data
                  </div>
                </div>
              </div>
            )}

            {displayedSegments.map((segment, index) => (
              <div key={`${segment.id}-${index}`}>
                <div className="flex justify-start">
                  <div className="flex flex-col max-w-full w-full">
                    <div className="prose prose-sm max-w-none">
                      {renderMarkdown(segment.text)}
                    </div>
                    {!segment.isComplete && (
                      <div className="flex items-center gap-0.5 mt-2">
                        <div
                          className="w-0.5 h-0.5 bg-foreground animate-pulse"
                          style={{ borderRadius: '0' }}
                        ></div>
                        <div
                          className="w-0.5 h-0.5 bg-foreground animate-pulse"
                          style={{
                            animationDelay: '0.2s',
                            borderRadius: '0',
                          }}
                        ></div>
                        <div
                          className="w-0.5 h-0.5 bg-foreground animate-pulse"
                          style={{
                            animationDelay: '0.4s',
                            borderRadius: '0',
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>

                {segment.isComplete && segment.showCards && showCards && (
                  <div className="flex justify-start mt-4">
                    <div className="w-full">
                      <div className="grid grid-cols-2 gap-3">
                        {cards.map((card, cardIndex) => (
                          <motion.div
                            key={card.title}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{
                              opacity: cardsVisible.includes(cardIndex) ? 1 : 0,
                              scale: cardsVisible.includes(cardIndex) ? 1 : 0.9,
                            }}
                            transition={{ duration: 0.3 }}
                            className="bg-secondary border border-border p-2"
                          >
                            <div className="text-[10px] mb-1 text-muted-foreground">
                              {card.title}
                            </div>
                            <div className="text-[14px] font-serif text-foreground">
                              {card.value}
                            </div>
                            <div className="text-[8px] mt-1 text-muted-foreground">
                              {card.change} {card.subtitle}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {segment.isComplete &&
                  index === displayedSegments.length - 1 &&
                  activeToolCall && (
                    <div className="flex justify-start mt-3 animate-fade-in">
                      <div className="px-2 py-1 flex items-center gap-2 h-6 w-fit bg-secondary border border-border">
                        <MaterialIcon
                          name={activeToolCall.icon as keyof typeof IconMap}
                          className="text-muted-foreground"
                          size={12}
                        />
                        <span className="animate-shimmer text-[12px] leading-[16px]  text-foreground">
                          {activeToolCall.text}
                        </span>
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-2 pt-2 pb-2 bg-secondary">
        <InputBar
          isLightMode={isLightMode}
          inputRef={inputRef}
          searchQuery=""
          setSearchQuery={() => {}}
          placeholder="Ask anything"
        />
      </div>
    </div>
  )
}

