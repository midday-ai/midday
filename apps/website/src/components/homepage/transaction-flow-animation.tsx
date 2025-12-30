'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MaterialIcon } from './icon-mapping'

interface AccountNode {
  id: number
  x: number
  y: number
  label: string
  color: string
}

interface Transaction {
  id: number
  description: string
  amount: number
  date: string
  category: string
  categoryColor: string
  taxAmount: number
}

export function TransactionFlowAnimation({
  onComplete,
}: {
  onComplete?: () => void
}) {
  const [showAccounts, setShowAccounts] = useState(false)
  const [showArrows, setShowArrows] = useState(false)
  const [showTransactions, setShowTransactions] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Account nodes positioned horizontally at the top, centered
  // Use responsive spacing that adapts via viewBox scaling
  const topY = isMobile ? 60 : 80
  const nodeSpacing = 90
  const viewBoxWidth = 500
  const totalNodesWidth = nodeSpacing * 3 // Distance from first to last node center
  const startX = (viewBoxWidth - totalNodesWidth) / 2 // Center the group
  
  const accountNodes: AccountNode[] = [
    { id: 1, x: startX, y: topY, label: 'Account', color: 'hsl(var(--muted-foreground))' },
    { id: 2, x: startX + nodeSpacing, y: topY, label: 'Account', color: 'hsl(var(--muted-foreground))' },
    { id: 3, x: startX + nodeSpacing * 2, y: topY, label: 'Account', color: 'hsl(var(--muted-foreground))' },
    { id: 4, x: startX + nodeSpacing * 3, y: topY, label: 'Account', color: 'hsl(var(--muted-foreground))' },
  ]

  // Format amount helper
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount))
  }

  // Unified transaction list in the center
  const transactions: Transaction[] = [
    {
      id: 1,
      description: 'Office Supplies Co.',
      amount: -45.20,
      taxAmount: 9.04,
      date: 'Sep 10',
      category: 'Office Supplies',
      categoryColor: '#1976D2',
    },
    {
      id: 2,
      description: 'Cloud Services Inc.',
      amount: -89.00,
      taxAmount: 17.80,
      date: 'Sep 10',
      category: 'Software',
      categoryColor: '#2196F3',
    },
    {
      id: 3,
      description: 'Freelance Payment',
      amount: 1200.00,
      taxAmount: 0,
      date: 'Sep 09',
      category: 'Income',
      categoryColor: '#4CAF50',
    },
    {
      id: 4,
      description: 'Marketing Agency',
      amount: -350.00,
      taxAmount: 70.00,
      date: 'Sep 09',
      category: 'Marketing',
      categoryColor: '#9C27B0',
    },
    {
      id: 5,
      description: 'Software Subscription',
      amount: -24.00,
      taxAmount: 4.80,
      date: 'Sep 08',
      category: 'Software',
      categoryColor: '#2196F3',
    },
    {
      id: 6,
      description: 'AWS',
      amount: -1820.50,
      taxAmount: 364.10,
      date: 'Sep 08',
      category: 'Infrastructure',
      categoryColor: '#FF9800',
    },
    {
      id: 7,
      description: 'Stripe Payment',
      amount: 2450.00,
      taxAmount: 0,
      date: 'Sep 07',
      category: 'Income',
      categoryColor: '#4CAF50',
    },
    {
      id: 8,
      description: 'Figma',
      amount: -225.88,
      taxAmount: 45.18,
      date: 'Sep 07',
      category: 'Office Supplies',
      categoryColor: '#1976D2',
    },
    {
      id: 9,
      description: 'Webflow',
      amount: -176.36,
      taxAmount: 35.27,
      date: 'Sep 06',
      category: 'Software',
      categoryColor: '#2196F3',
    },
    {
      id: 10,
      description: 'GitHub',
      amount: -44.00,
      taxAmount: 8.80,
      date: 'Sep 06',
      category: 'Software',
      categoryColor: '#2196F3',
    },
    {
      id: 11,
      description: 'Notion',
      amount: -120.00,
      taxAmount: 24.00,
      date: 'Sep 05',
      category: 'Software',
      categoryColor: '#2196F3',
    },
    {
      id: 12,
      description: 'OpenAI',
      amount: -89.50,
      taxAmount: 17.90,
      date: 'Sep 05',
      category: 'Software',
      categoryColor: '#2196F3',
    },
    {
      id: 13,
      description: 'Vercel',
      amount: -299.00,
      taxAmount: 59.80,
      date: 'Sep 04',
      category: 'Infrastructure',
      categoryColor: '#FF9800',
    },
    {
      id: 14,
      description: 'Adobe',
      amount: -649.00,
      taxAmount: 129.80,
      date: 'Sep 04',
      category: 'Software',
      categoryColor: '#2196F3',
    },
    {
      id: 15,
      description: 'Client Invoice',
      amount: 8500.00,
      taxAmount: 0,
      date: 'Sep 03',
      category: 'Income',
      categoryColor: '#4CAF50',
    },
  ]

  // Straight line paths from top accounts down to transaction list
  // Lines go straight down from each account node to the table
  // The SVG viewBox is 500x180 on mobile (taller viewBox with smaller container makes lines extend further)
  // Lines end at the bottom of the viewBox to connect to table
  const transactionListTopY = isMobile ? 180 : 200
  const viewBoxHeight = isMobile ? 180 : 200
  
  const arrowPaths = [
    { 
      id: 1, 
      from: { x: accountNodes[0].x, y: accountNodes[0].y + 18 }, 
      to: { x: accountNodes[0].x, y: transactionListTopY },
    },
    { 
      id: 2, 
      from: { x: accountNodes[1].x, y: accountNodes[1].y + 18 }, 
      to: { x: accountNodes[1].x, y: transactionListTopY },
    },
    { 
      id: 3, 
      from: { x: accountNodes[2].x, y: accountNodes[2].y + 18 }, 
      to: { x: accountNodes[2].x, y: transactionListTopY },
    },
    { 
      id: 4, 
      from: { x: accountNodes[3].x, y: accountNodes[3].y + 18 }, 
      to: { x: accountNodes[3].x, y: transactionListTopY },
    },
  ] as const

  useEffect(() => {
    // Reset animation
    setShowAccounts(false)
    setShowArrows(false)
    setShowTransactions(false)

    // Sequence: accounts -> arrows -> transactions
    const accountsTimer = setTimeout(() => setShowAccounts(true), 300)
    const arrowsTimer = setTimeout(() => setShowArrows(true), 800)
    const transactionsTimer = setTimeout(() => setShowTransactions(true), 1200)

    let done: NodeJS.Timeout | undefined
    if (onComplete) {
      done = setTimeout(() => {
        onComplete()
      }, 10000)
    }

    return () => {
      clearTimeout(accountsTimer)
      clearTimeout(arrowsTimer)
      clearTimeout(transactionsTimer)
      if (done) clearTimeout(done)
    }
  }, [onComplete])

  useEffect(() => {
    if (!onComplete) {
      const interval = setInterval(() => {
        setShowAccounts(false)
        setShowArrows(false)
        setShowTransactions(false)

        const accountsTimer = setTimeout(() => setShowAccounts(true), 300)
        const arrowsTimer = setTimeout(() => setShowArrows(true), 800)
        const transactionsTimer = setTimeout(() => setShowTransactions(true), 1200)

        return () => {
          clearTimeout(accountsTimer)
          clearTimeout(arrowsTimer)
          clearTimeout(transactionsTimer)
        }
      }, 10000)

      return () => clearInterval(interval)
    }
  }, [onComplete])

  return (
    <div className="w-full h-full bg-background flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="px-2 md:px-3 pt-2 md:pt-3 pb-1.5 md:pb-2 border-b border-border">
        <h3 className="text-[13px] md:text-[14px] text-foreground">Transactions</h3>
      </div>

      {/* Main content area */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {/* SVG for account nodes and arrows */}
        <div className="flex-shrink-0 h-[140px] md:h-[200px] relative overflow-hidden">
          <svg
            className="w-full h-full"
            viewBox={`0 0 500 ${viewBoxHeight}`}
            preserveAspectRatio="xMidYMin meet"
            style={{ display: 'block' }}
          >
          {/* Account nodes horizontally at the top */}
          {accountNodes.map((node, index) => (
            <g key={node.id}>
              <rect
                x={node.x - 18}
                y={node.y - 18}
                width={36}
                height={36}
                rx={0}
                fill="hsl(var(--secondary))"
                stroke="hsl(var(--border))"
                strokeWidth={1}
                opacity={showAccounts ? 1 : 0}
              />
              {/* Account icon inside the container */}
              <foreignObject
                x={node.x - 18}
                y={node.y - 18}
                width={36}
                height={36}
                style={{ overflow: 'visible' }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      color: 'hsl(var(--muted-foreground))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: showAccounts ? 1 : 0,
                    }}
                  >
                    <MaterialIcon
                      name="account_balance"
                      size={18}
                    />
                  </div>
                </div>
              </foreignObject>
              {/* Account label - hidden on mobile to save space */}
              <text
                x={node.x}
                y={node.y - 25}
                textAnchor="middle"
                fontSize="9"
                fill="hsl(var(--muted-foreground))"
                opacity={showAccounts ? 1 : 0}
                className="hidden md:block"
              >
                {node.label}
              </text>
            </g>
          ))}

          {/* Straight dashed lines flowing down to transaction list */}
          {arrowPaths.map((arrow, index) => {
            const pathId = `arrow-${arrow.id}`
            // Create a straight line path
            const pathD = `M ${arrow.from.x} ${arrow.from.y} L ${arrow.to.x} ${arrow.to.y}`
            const dashLength = 4 // Length of dash
            const gapLength = 3 // Length of gap
            const totalDashLength = dashLength + gapLength

            return (
              <motion.path
                key={pathId}
                d={pathD}
                stroke="hsl(var(--border))"
                strokeWidth={1}
                fill="none"
                strokeDasharray={`${dashLength} ${gapLength}`}
                initial={{ opacity: 0, strokeDashoffset: 0 }}
                animate={{
                  opacity: showArrows ? 1 : 0,
                  strokeDashoffset: showArrows ? [0, -totalDashLength] : 0,
                }}
                transition={{
                  opacity: {
                    duration: 0.3,
                    delay: index * 0.15,
                  },
                  strokeDashoffset: {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                    delay: index * 0.15 + 0.3,
                  },
                }}
              />
            )
          })}
          </svg>
        </div>

        {/* Transaction list full width below - Midday table style */}
        <div className="flex-1 min-h-0 overflow-hidden border-t border-l border-r border-border bg-background">
          <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-secondary border-b border-border">
                <tr className="h-[28px] md:h-[32px]">
                  <th className="w-[60px] md:w-[70px] px-1.5 md:px-2 text-left text-[10px] md:text-[11px] font-medium text-muted-foreground border-r border-border">Date</th>
                  <th className="w-[140px] md:w-[160px] px-1.5 md:px-2 text-left text-[10px] md:text-[11px] font-medium text-muted-foreground border-r border-border">Description</th>
                  <th className="w-[90px] md:w-[100px] px-1.5 md:px-2 text-left text-[10px] md:text-[11px] font-medium text-muted-foreground border-r border-border">Amount</th>
                  <th className="w-[110px] md:w-[120px] px-1.5 md:px-2 text-left text-[10px] md:text-[11px] font-medium text-muted-foreground">Category</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction, index) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                      opacity: showTransactions ? 1 : 0,
                      y: showTransactions ? 0 : 10,
                    }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.08,
                      ease: 'easeOut',
                    }}
                    className="h-[28px] md:h-[32px] border-b border-border bg-background hover:bg-secondary transition-colors"
                  >
                    {/* Date */}
                    <td className="w-[60px] md:w-[70px] px-1.5 md:px-2 text-[10px] md:text-[11px] text-muted-foreground border-r border-border">
                      {transaction.date}
                    </td>

                    {/* Description */}
                    <td className={`w-[140px] md:w-[160px] px-1.5 md:px-2 text-[10px] md:text-[11px] border-r border-border ${
                      transaction.amount > 0 ? 'text-[#4CAF50]' : 'text-foreground'
                    }`}>
                      <div className="truncate" title={transaction.description}>
                        {transaction.description}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className={`w-[90px] md:w-[100px] px-1.5 md:px-2 text-[10px] md:text-[11px] border-r border-border ${
                      transaction.amount > 0 ? 'text-[#4CAF50]' : 'text-foreground'
                    }`}>
                      {transaction.amount > 0 ? '+' : '-'}{formatAmount(transaction.amount)} kr
                    </td>

                    {/* Category */}
                    <td className="w-[110px] md:w-[120px] px-1.5 md:px-2">
                      <div className="flex items-center gap-1 md:gap-1.5">
                        <div 
                          className="w-2 h-2 md:w-2.5 md:h-2.5 flex-shrink-0"
                          style={{ backgroundColor: transaction.categoryColor }}
                        />
                        <span className="text-[10px] md:text-[11px] text-foreground truncate">
                          {transaction.category}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  )
}

