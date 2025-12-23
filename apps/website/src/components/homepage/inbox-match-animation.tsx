'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MaterialIcon } from './icon-mapping'

export function InboxMatchAnimation({
  onComplete,
}: {
  onComplete?: () => void
}) {
  const [showIncoming, setShowIncoming] = useState(false)
  const [showSuggestBar, setShowSuggestBar] = useState(false)
  const [showItems, setShowItems] = useState(false)
  const items = [
    {
      id: 1,
      title: 'Google Workspace — Invoice.pdf',
      amount: '$12.00',
      date: 'Sep 08',
    },
    {
      id: 2,
      title: 'AWS — Receipt.pdf',
      amount: '$54.30',
      date: 'Sep 07',
    },
    {
      id: 3,
      title: 'Figma — Receipt.pdf',
      amount: '$24.00',
      date: 'Sep 06',
    },
    {
      id: 4,
      title: 'GitHub — Receipt.pdf',
      amount: '$9.00',
      date: 'Sep 05',
    },
    {
      id: 5,
      title: 'Notion — Receipt.pdf',
      amount: '$16.00',
      date: 'Sep 04',
    },
    {
      id: 6,
      title: 'Slack — Receipt.pdf',
      amount: '$8.50',
      date: 'Sep 03',
    },
  ]
  const incomingItem = {
    id: 999,
    title: 'Stripe, Inc — Receipt.pdf',
    amount: '$89.00',
    date: 'Sep 10',
  }

  useEffect(() => {
    setShowSuggestBar(false)
    setShowItems(false)
    setShowIncoming(false)
    const itemsTimer = setTimeout(() => setShowItems(true), 300)
    const incomingTimer = setTimeout(() => setShowIncoming(true), 1400)
    const barTimer = setTimeout(() => setShowSuggestBar(true), 1800)

    let done: NodeJS.Timeout | undefined
    if (onComplete) {
      done = setTimeout(() => {
        onComplete()
      }, 12000)
    }

    return () => {
      clearTimeout(itemsTimer)
      clearTimeout(incomingTimer)
      clearTimeout(barTimer)
      if (done) clearTimeout(done)
    }
  }, [onComplete])

  useEffect(() => {
    if (!onComplete) {
      const interval = setInterval(() => {
        setShowSuggestBar(false)
        setShowItems(false)
        setShowIncoming(false)
        const itemsTimer = setTimeout(() => setShowItems(true), 300)
        const incomingTimer = setTimeout(() => setShowIncoming(true), 1400)
        const barTimer = setTimeout(() => setShowSuggestBar(true), 1800)
      }, 12000)

      return () => clearInterval(interval)
    }
  }, [onComplete])

  return (
    <div className="w-full h-full bg-background flex flex-col relative">
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[14px] text-foreground ">Inbox</h3>
          <div className="flex items-center gap-2">
            <button className="w-6 h-6 flex items-center justify-center hover:bg-muted transition-colors">
              <MaterialIcon name="filter_list" className="text-sm text-muted-foreground" size={16} />
            </button>
            <button className="w-6 h-6 flex items-center justify-center hover:bg-muted transition-colors">
              <MaterialIcon name="more_vert" className="text-sm text-muted-foreground" size={16} />
            </button>
          </div>
        </div>
        <div className="relative pr-1">
          <input
            type="text"
            placeholder="Search inbox..."
            className="w-full bg-background border border-border px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-border/50 rounded-none"
          />
          <MaterialIcon
            name="search"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground"
            size={16}
          />
        </div>
      </div>

      <div className="flex-1 px-3 pb-3 overflow-visible relative">
        <div className="h-full pr-1 pt-0 pb-32 flex flex-col justify-end gap-2">
          {items.slice(1).map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: showItems ? 1 : 0 }}
              transition={{
                duration: 0.25,
                delay: showItems ? idx * 0.1 : 0,
              }}
              className="bg-background border border-border p-3 transform-gpu will-change-transform"
            >
              <div className="flex items-start gap-2">
                <span className="inline-flex w-6 h-6 items-center justify-center bg-secondary border border-border">
                  <MaterialIcon name="receipt_long" className="text-sm text-muted-foreground" size={16} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] text-foreground truncate">
                      {item.title}
                    </p>
                    <span className="text-[12px] text-muted-foreground whitespace-nowrap">
                      {item.amount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">
                      Inbox
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {item.date}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {showIncoming && (
            <motion.div
              key={incomingItem.id}
              initial={{ opacity: 0, y: 48 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 250,
                damping: 24,
                mass: 0.6,
              }}
              className="bg-secondary border border-border p-3 transform-gpu will-change-transform absolute bottom-[68px] left-3 right-[11px] z-50"
            >
              <div className="flex items-start gap-2">
                <span className="inline-flex w-6 h-6 items-center justify-center bg-secondary border border-border">
                  <MaterialIcon name="receipt_long" className="text-sm text-muted-foreground" size={16} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] text-foreground truncate">
                      {incomingItem.title}
                    </p>
                    <span className="text-[12px] text-muted-foreground whitespace-nowrap">
                      {incomingItem.amount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">
                      From: receipts@stripe.com
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {incomingItem.date}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: showSuggestBar ? 1 : 0, y: showSuggestBar ? 0 : 10 }}
        transition={{ duration: 0.25 }}
        className="px-3 pt-3 pb-3 relative z-40"
      >
        <div className="w-full bg-secondary border border-border px-3 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <MaterialIcon name="link" className=" text-sm text-muted-foreground" size={16} />
            <div className="min-w-0">
              <div className="text-[14px] text-foreground truncate">
                Suggested match
              </div>
              <div className="text-[12px] text-muted-foreground truncate">
                Transaction • Stripe, Inc • $89.00 • Sep 10
              </div>
            </div>
          </div>
          <button className="ml-3 flex items-center justify-center h-8 px-3 bg-background border border-border text-[12px] text-foreground hover:bg-muted transition-colors">
            Review
          </button>
        </div>
      </motion.div>
    </div>
  )
}

