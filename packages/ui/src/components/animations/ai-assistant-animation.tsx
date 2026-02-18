"use client";

import { Icons } from "@midday/ui/icons";
import { motion } from "framer-motion";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import type { IconType } from "react-icons";
import { MdOutlineReceipt, MdOutlineTrendingUp } from "react-icons/md";

const dynamicIconMap: Record<string, IconType> = {
  trending_up: MdOutlineTrendingUp,
  receipt: MdOutlineReceipt,
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

export function AIAssistantAnimation({
  onComplete,
  shouldPlay = true,
  isLightMode = false,
}: {
  onComplete?: () => void;
  shouldPlay?: boolean;
  isLightMode?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showUserMessage, setShowUserMessage] = useState(false);
  const [displayedSegments, setDisplayedSegments] = useState<
    Array<{
      id: number;
      text: string;
      textMobile?: string;
      isComplete: boolean;
      showCards?: boolean;
    }>
  >([]);
  const [activeToolCall, setActiveToolCall] = useState<{
    text: string;
    icon: string;
  } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [cardsVisible, setCardsVisible] = useState<number[]>([]);

  const cards = [
    {
      icon: "trending_up",
      title: "Revenue",
      value: "$4,200",
      change: "+12%",
      changeType: "positive" as const,
      subtitle: "vs last week",
    },
    {
      icon: "trending_down",
      title: "Expenses",
      value: "$1,800",
      change: "-8%",
      changeType: "positive" as const,
      subtitle: "vs last week",
    },
    {
      icon: "account_balance_wallet",
      title: "Net Profit",
      value: "$2,400",
      change: "+28%",
      changeType: "positive" as const,
      subtitle: "vs last week",
    },
    {
      icon: "savings",
      title: "Cash Flow",
      value: "+$1,200",
      change: "+15%",
      changeType: "positive" as const,
      subtitle: "this week",
    },
  ];

  const responseSegments = [
    {
      id: 1,
      text: "# Weekly Summary — September 8-14, 2025\n\n## Key Highlights\n\nHere's a quick snapshot of your most important metrics this week. Revenue is trending up while expenses are well-controlled, resulting in strong profitability and healthy cash flow.",
      toolCall: {
        text: "Analyzing financial data",
        icon: "trending_up",
        duration: 2000,
      },
      showCards: true,
    },
    {
      id: 2,
      text: "## Business Activity\n\nBusiness activity included 8 invoices sent (3 more than last week), 47 hours tracked across projects, $2,800 in forecasted revenue from tracked hours, 23 receipts automatically matched to transactions, and 4 bank transactions categorized automatically.\n\nKeep monitoring cash flow trends to maintain this positive momentum.",
      textMobile:
        "## Business Activity\n\nBusiness activity included 8 invoices sent (3 more than last week), 47 hours tracked across projects, $2,800 in forecasted revenue from tracked hours, 23 receipts automatically matched to transactions, and 4 bank transactions categorized automatically.",
      toolCall: {
        text: "Processing business metrics",
        icon: "receipt",
        duration: 1600,
      },
    },
  ];

  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    const elements: ReactElement[] = [];
    let elementKey = 0;

    for (const line of lines) {
      const key = `line-${elementKey++}`;
      if (line.trim() === "") {
        elements.push(<div key={key} className="h-1" />);
      } else if (line.startsWith("# ")) {
        elements.push(
          <h1
            key={key}
            className="text-[14px] mb-1 md:mb-2 mt-2 md:mt-3 first:mt-0 text-foreground"
          >
            {line.slice(2)}
          </h1>,
        );
      } else if (line.startsWith("## ")) {
        elements.push(
          <h2
            key={key}
            className="text-[12px] mb-1 md:mb-2 mt-2 md:mt-3 text-foreground"
          >
            {line.slice(3)}
          </h2>,
        );
      } else {
        elements.push(
          <p
            key={key}
            className="text-[11px] md:text-[12px] leading-[15px] md:leading-[18px] text-foreground mb-1 md:mb-1.5"
          >
            {line}
          </p>,
        );
      }
    }
    return elements;
  };

  useEffect(() => {
    if (!shouldPlay) return;

    const processSegments = () => {
      let segmentIndex = 0;

      const processNextSegment = () => {
        if (segmentIndex >= responseSegments.length) {
          setIsTyping(false);
          return;
        }

        const segment = responseSegments[segmentIndex];
        if (!segment) {
          setIsTyping(false);
          return;
        }

        const words = segment.text.split(" ");
        let wordIndex = 0;

        const typeWords = () => {
          if (wordIndex < words.length) {
            const currentText = words.slice(0, wordIndex + 1).join(" ");
            setDisplayedSegments((prev) => [
              ...prev.slice(0, segmentIndex),
              {
                id: segment.id,
                text: currentText,
                textMobile: segment.textMobile,
                isComplete: false,
                showCards: segment.showCards,
              },
            ]);
            wordIndex++;
            setTimeout(typeWords, 30);
          } else {
            setDisplayedSegments((prev) => [
              ...prev.slice(0, segmentIndex),
              {
                id: segment.id,
                text: segment.text,
                textMobile: segment.textMobile,
                isComplete: true,
                showCards: segment.showCards,
              },
            ]);

            if (segment.toolCall) {
              setActiveToolCall(segment.toolCall);
              setTimeout(() => {
                setActiveToolCall(null);
                segmentIndex++;
                setTimeout(processNextSegment, 200);
              }, segment.toolCall.duration);
            } else {
              segmentIndex++;
              setTimeout(processNextSegment, 200);
            }
          }
        };

        typeWords();
      };

      processNextSegment();
    };

    setTimeout(() => {
      setShowUserMessage(true);
    }, 500);

    setTimeout(() => {
      setIsTyping(true);
      processSegments();
    }, 1000);

    const doneTimer = onComplete
      ? setTimeout(() => {
          onComplete();
        }, 12000)
      : undefined;

    return () => {
      if (doneTimer) clearTimeout(doneTimer);
    };
  }, [shouldPlay, onComplete]);

  useEffect(() => {
    if (
      displayedSegments.length > 0 &&
      displayedSegments[0]?.isComplete &&
      displayedSegments[0]?.showCards
    ) {
      setShowCards(true);
      cards.forEach((_, cardIndex) => {
        setTimeout(() => {
          setCardsVisible((prev) => [...prev, cardIndex]);
        }, cardIndex * 150);
      });
    }
  }, [displayedSegments]);

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col relative">
      <div className="flex-1 px-2 md:px-3 py-2 md:py-3 overflow-hidden">
        <div className="space-y-2 md:space-y-4 h-full flex flex-col">
          <div className="flex justify-end">
            <div
              className={`px-2 py-1 max-w-[85%] md:max-w-xs rounded-bl-[100px] rounded-tl-[100px] bg-secondary transition-opacity duration-75 ease-out ${
                showUserMessage ? "opacity-100" : "opacity-0"
              }`}
            >
              <p className="text-[11px] md:text-[12px] text-right text-foreground">
                Show me weekly summary
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
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
              <div
                key={`${segment.id}-${index}`}
                className={index > 0 ? "mt-3 md:mt-5" : ""}
              >
                <div className="flex justify-start">
                  <div className="flex flex-col max-w-full w-full">
                    <div className="prose prose-sm max-w-none">
                      <div className="hidden md:block">
                        {renderMarkdown(segment.text)}
                      </div>
                      <div className="md:hidden">
                        {renderMarkdown(segment.textMobile || segment.text)}
                      </div>
                    </div>
                    {!segment.isComplete && (
                      <div className="flex items-center gap-0.5 mt-2 md:mt-3">
                        <div
                          className="w-0.5 h-0.5 bg-foreground animate-pulse"
                          style={{ borderRadius: "0" }}
                        />
                        <div
                          className="w-0.5 h-0.5 bg-foreground animate-pulse"
                          style={{
                            animationDelay: "0.2s",
                            borderRadius: "0",
                          }}
                        />
                        <div
                          className="w-0.5 h-0.5 bg-foreground animate-pulse"
                          style={{
                            animationDelay: "0.4s",
                            borderRadius: "0",
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {segment.isComplete && segment.showCards && showCards && (
                  <div className="flex justify-start mt-4 md:mt-6">
                    <div className="w-full">
                      <div className="grid grid-cols-2 gap-2 md:gap-3">
                        {cards.map((card, cardIndex) => (
                          <motion.div
                            key={card.title}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{
                              opacity: cardsVisible.includes(cardIndex) ? 1 : 0,
                              scale: cardsVisible.includes(cardIndex) ? 1 : 0.9,
                            }}
                            transition={{ duration: 0.3 }}
                            className="bg-secondary border border-border p-1.5 md:p-2"
                          >
                            <div className="text-[9px] md:text-[10px] mb-0.5 md:mb-1 text-muted-foreground">
                              {card.title}
                            </div>
                            <div className="text-[12px] md:text-[14px] font-serif text-foreground">
                              {card.value}
                            </div>
                            <div className="text-[7px] md:text-[8px] mt-0.5 md:mt-1 text-muted-foreground">
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
                    <div className="flex justify-start mt-3 md:mt-4 animate-fade-in">
                      <div className="px-2 py-1 flex items-center gap-2 h-6 w-fit bg-secondary border border-border">
                        <DynamicIcon
                          name={activeToolCall.icon}
                          className="text-muted-foreground"
                          size={12}
                        />
                        <motion.span
                          className="text-[10px] leading-[14px] relative inline-block bg-gradient-to-r from-muted-foreground via-foreground to-muted-foreground bg-[length:200%_100%] bg-clip-text text-transparent"
                          animate={{
                            backgroundPosition: ["200% 0", "-200% 0"],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                          }}
                        >
                          {activeToolCall.text}
                        </motion.span>
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border border-border bg-secondary">
        {/* Input Field */}
        <div className="flex items-center px-2 md:px-3 py-1.5 md:py-2">
          <input
            type="text"
            placeholder="Ask anything"
            className="flex-1 bg-transparent border-0 outline-none text-[10px] md:text-[11px] text-foreground placeholder:text-muted-foreground"
            readOnly
          />
        </div>

        {/* Icons Row */}
        <div className="flex items-end justify-between px-2 md:px-3 pb-1.5 md:pb-2">
          <div className="flex items-center gap-1 md:gap-1.5">
            <button
              type="button"
              className="w-4 h-4 md:w-5 md:h-5 flex items-center justify-center transition-colors text-muted-foreground"
            >
              <Icons.Add size={12} className="md:w-[14px] md:h-[14px]" />
            </button>
            <button
              type="button"
              className="w-4 h-4 md:w-5 md:h-5 flex items-center justify-center transition-colors text-muted-foreground"
            >
              <Icons.Bolt size={12} className="md:w-[14px] md:h-[14px]" />
            </button>
            <button
              type="button"
              className="w-4 h-4 md:w-5 md:h-5 flex items-center justify-center transition-colors text-muted-foreground"
            >
              <Icons.Globle size={12} className="md:w-[14px] md:h-[14px]" />
            </button>
            <button
              type="button"
              className="w-4 h-4 md:w-5 md:h-5 flex items-center justify-center transition-colors text-muted-foreground"
            >
              <Icons.Time size={12} className="md:w-[14px] md:h-[14px]" />
            </button>
          </div>
          <div className="flex items-end gap-1 md:gap-1.5">
            <button
              type="button"
              className="w-4 h-4 md:w-5 md:h-5 flex items-center justify-center transition-colors text-muted-foreground"
            >
              <Icons.Record size={12} className="md:w-[14px] md:h-[14px]" />
            </button>
            <button
              type="button"
              className="w-4 h-4 md:w-5 md:h-5 flex items-center justify-center transition-opacity bg-foreground"
            >
              <Icons.ArrowUpward
                size={10}
                className="text-background md:w-[12px] md:h-[12px]"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
