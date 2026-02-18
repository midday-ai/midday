"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { IconType } from "react-icons";
import {
  MdOutlineAccountBalance,
  MdOutlineAccountBalanceWallet,
  MdOutlineCreditCard,
  MdOutlineSavings,
} from "react-icons/md";

const dynamicIconMap: Record<string, IconType> = {
  account_balance: MdOutlineAccountBalance,
  credit_card: MdOutlineCreditCard,
  account_balance_wallet: MdOutlineAccountBalanceWallet,
  savings: MdOutlineSavings,
};

function DynamicIcon({
  name,
  className,
  size,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  const Icon = dynamicIconMap[name];
  return Icon ? <Icon className={className} size={size} /> : null;
}

interface AccountNode {
  id: number;
  x: number;
  y: number;
  label: string;
  color: string;
  icon: string;
}

interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  category: string;
  categoryColor: string;
  taxAmount: number;
}

export function TransactionFlowAnimation({
  onComplete,
  shouldPlay = true,
}: {
  onComplete?: () => void;
  shouldPlay?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showAccounts, setShowAccounts] = useState(false);
  const [showArrows, setShowArrows] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const topY = isMobile ? 60 : 80;
  const nodeSpacing = 90;
  const viewBoxWidth = 500;
  const totalNodesWidth = nodeSpacing * 3;
  const startX = (viewBoxWidth - totalNodesWidth) / 2;

  const accountNodes: AccountNode[] = [
    {
      id: 1,
      x: startX,
      y: topY,
      label: "Account",
      color: "hsl(var(--muted-foreground))",
      icon: "account_balance",
    },
    {
      id: 2,
      x: startX + nodeSpacing,
      y: topY,
      label: "Account",
      color: "hsl(var(--muted-foreground))",
      icon: "credit_card",
    },
    {
      id: 3,
      x: startX + nodeSpacing * 2,
      y: topY,
      label: "Account",
      color: "hsl(var(--muted-foreground))",
      icon: "account_balance_wallet",
    },
    {
      id: 4,
      x: startX + nodeSpacing * 3,
      y: topY,
      label: "Account",
      color: "hsl(var(--muted-foreground))",
      icon: "savings",
    },
  ];

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("sv-SE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

  const transactions: Transaction[] = [
    {
      id: 1,
      description: "Office Supplies Co.",
      amount: -45.2,
      taxAmount: 9.04,
      date: "Sep 10",
      category: "Office Supplies",
      categoryColor: "#1976D2",
    },
    {
      id: 2,
      description: "Cloud Services Inc.",
      amount: -89.0,
      taxAmount: 17.8,
      date: "Sep 10",
      category: "Software",
      categoryColor: "#2196F3",
    },
    {
      id: 3,
      description: "Freelance Payment",
      amount: 1200.0,
      taxAmount: 0,
      date: "Sep 09",
      category: "Income",
      categoryColor: "#4CAF50",
    },
    {
      id: 4,
      description: "Marketing Agency",
      amount: -350.0,
      taxAmount: 70.0,
      date: "Sep 09",
      category: "Marketing",
      categoryColor: "#9C27B0",
    },
    {
      id: 5,
      description: "Software Subscription",
      amount: -24.0,
      taxAmount: 4.8,
      date: "Sep 08",
      category: "Software",
      categoryColor: "#2196F3",
    },
    {
      id: 6,
      description: "AWS",
      amount: -1820.5,
      taxAmount: 364.1,
      date: "Sep 08",
      category: "Infrastructure",
      categoryColor: "#FF9800",
    },
    {
      id: 7,
      description: "Stripe Payment",
      amount: 2450.0,
      taxAmount: 0,
      date: "Sep 07",
      category: "Income",
      categoryColor: "#4CAF50",
    },
    {
      id: 8,
      description: "Figma",
      amount: -225.88,
      taxAmount: 45.18,
      date: "Sep 07",
      category: "Office Supplies",
      categoryColor: "#1976D2",
    },
    {
      id: 9,
      description: "Webflow",
      amount: -176.36,
      taxAmount: 35.27,
      date: "Sep 06",
      category: "Software",
      categoryColor: "#2196F3",
    },
    {
      id: 10,
      description: "GitHub",
      amount: -44.0,
      taxAmount: 8.8,
      date: "Sep 06",
      category: "Software",
      categoryColor: "#2196F3",
    },
    {
      id: 11,
      description: "Notion",
      amount: -120.0,
      taxAmount: 24.0,
      date: "Sep 05",
      category: "Software",
      categoryColor: "#2196F3",
    },
    {
      id: 12,
      description: "OpenAI",
      amount: -89.5,
      taxAmount: 17.9,
      date: "Sep 05",
      category: "Software",
      categoryColor: "#2196F3",
    },
    {
      id: 13,
      description: "Vercel",
      amount: -299.0,
      taxAmount: 59.8,
      date: "Sep 04",
      category: "Infrastructure",
      categoryColor: "#FF9800",
    },
    {
      id: 14,
      description: "Adobe",
      amount: -649.0,
      taxAmount: 129.8,
      date: "Sep 04",
      category: "Software",
      categoryColor: "#2196F3",
    },
    {
      id: 15,
      description: "Client Invoice",
      amount: 8500.0,
      taxAmount: 0,
      date: "Sep 03",
      category: "Income",
      categoryColor: "#4CAF50",
    },
  ];

  const transactionListTopY = isMobile ? 180 : 200;
  const viewBoxHeight = isMobile ? 180 : 200;

  const arrowPaths = [
    {
      id: 1,
      from: { x: accountNodes[0]?.x ?? 0, y: (accountNodes[0]?.y ?? 0) + 18 },
      to: { x: accountNodes[0]?.x ?? 0, y: transactionListTopY },
    },
    {
      id: 2,
      from: { x: accountNodes[1]?.x ?? 0, y: (accountNodes[1]?.y ?? 0) + 18 },
      to: { x: accountNodes[1]?.x ?? 0, y: transactionListTopY },
    },
    {
      id: 3,
      from: { x: accountNodes[2]?.x ?? 0, y: (accountNodes[2]?.y ?? 0) + 18 },
      to: { x: accountNodes[2]?.x ?? 0, y: transactionListTopY },
    },
    {
      id: 4,
      from: { x: accountNodes[3]?.x ?? 0, y: (accountNodes[3]?.y ?? 0) + 18 },
      to: { x: accountNodes[3]?.x ?? 0, y: transactionListTopY },
    },
  ] as const;

  useEffect(() => {
    if (!shouldPlay) return;

    const accountsTimer = setTimeout(() => setShowAccounts(true), 0);
    const arrowsTimer = setTimeout(() => setShowArrows(true), 500);
    const transactionsTimer = setTimeout(() => setShowTransactions(true), 900);

    const doneTimer = onComplete
      ? setTimeout(() => {
          onComplete();
        }, 10000)
      : undefined;

    return () => {
      clearTimeout(accountsTimer);
      clearTimeout(arrowsTimer);
      clearTimeout(transactionsTimer);
      if (doneTimer) clearTimeout(doneTimer);
    };
  }, [shouldPlay, onComplete]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col relative overflow-hidden"
    >
      {/* Header */}
      <div className="px-2 md:px-3 pt-2 md:pt-3 pb-1.5 md:pb-2 border-b border-border relative z-10">
        <h3 className="text-[13px] md:text-[14px] text-foreground">
          Transactions
        </h3>
      </div>

      {/* Main content area */}
      <div className="flex-1 relative overflow-hidden flex flex-col z-10">
        {/* SVG for account nodes and arrows */}
        <div className="flex-shrink-0 h-[140px] md:h-[200px] relative overflow-hidden">
          <svg
            className="w-full h-full"
            viewBox={`0 0 500 ${viewBoxHeight}`}
            preserveAspectRatio="xMidYMin meet"
            style={{ display: "block" }}
          >
            {accountNodes.map((node, _index) => (
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
                <foreignObject
                  x={node.x - 18}
                  y={node.y - 18}
                  width={36}
                  height={36}
                  style={{ overflow: "visible" }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        color: "hsl(var(--muted-foreground))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: showAccounts ? 1 : 0,
                      }}
                    >
                      <DynamicIcon name={node.icon} size={18} />
                    </div>
                  </div>
                </foreignObject>
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

            {arrowPaths.map((arrow, index) => {
              const pathId = `arrow-${arrow.id}`;
              const pathD = `M ${arrow.from.x} ${arrow.from.y} L ${arrow.to.x} ${arrow.to.y}`;
              const dashLength = 4;
              const gapLength = 3;
              const totalDashLength = dashLength + gapLength;

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
                    opacity: { duration: 0.3, delay: index * 0.15 },
                    strokeDashoffset: {
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                      delay: index * 0.15 + 0.3,
                    },
                  }}
                />
              );
            })}
          </svg>
        </div>

        {/* Transaction list */}
        <div className="flex-1 min-h-0 overflow-hidden border border-border bg-background">
          <table
            className="w-full border-collapse"
            style={{ borderSpacing: 0 }}
          >
            <thead className="sticky top-0 z-10 bg-secondary border-b border-border">
              <tr className="h-[28px] md:h-[32px]">
                <th className="w-[60px] md:w-[70px] px-1.5 md:px-2 text-left text-[10px] md:text-[11px] font-medium text-muted-foreground border-r border-border">
                  Date
                </th>
                <th className="w-[140px] md:w-[160px] px-1.5 md:px-2 text-left text-[10px] md:text-[11px] font-medium text-muted-foreground border-r border-border">
                  Description
                </th>
                <th className="w-[90px] md:w-[100px] px-1.5 md:px-2 text-left text-[10px] md:text-[11px] font-medium text-muted-foreground border-r border-border">
                  Amount
                </th>
                <th className="w-[110px] md:w-[120px] px-1.5 md:px-2 text-left text-[10px] md:text-[11px] font-medium text-muted-foreground">
                  Category
                </th>
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
                    ease: "easeOut",
                  }}
                  className="h-[28px] md:h-[32px] border-b border-border bg-background hover:bg-secondary transition-colors"
                >
                  <td className="w-[60px] md:w-[70px] px-1.5 md:px-2 text-[10px] md:text-[11px] text-muted-foreground border-r border-border">
                    {transaction.date}
                  </td>
                  <td
                    className={`w-[140px] md:w-[160px] px-1.5 md:px-2 text-[10px] md:text-[11px] border-r border-border ${
                      transaction.amount > 0
                        ? "text-[#4CAF50]"
                        : "text-foreground"
                    }`}
                  >
                    <div className="truncate" title={transaction.description}>
                      {transaction.description}
                    </div>
                  </td>
                  <td
                    className={`w-[90px] md:w-[100px] px-1.5 md:px-2 text-[10px] md:text-[11px] border-r border-border ${
                      transaction.amount > 0
                        ? "text-[#4CAF50]"
                        : "text-foreground"
                    }`}
                  >
                    {transaction.amount > 0 ? "+" : "-"}
                    {formatAmount(transaction.amount)} kr
                  </td>
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
  );
}
