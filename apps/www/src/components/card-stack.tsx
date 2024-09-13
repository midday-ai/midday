"use client";

import { useEffect, useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { motion } from "framer-motion";

let interval: any;

type Card = {
  id: number;
  content: React.ReactNode;
  name: string;
};

export const CardStack = ({
  items,
  offset,
  scaleFactor,
}: {
  items: Card[];
  offset?: number;
  scaleFactor?: number;
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const CARD_OFFSET = isDesktop ? 10 : 5;
  const SCALE_FACTOR = scaleFactor || 0.06;
  const [cards, setCards] = useState<Card[]>([items.at(0)]);

  useEffect(() => {
    startFlipping();
    setCards(items);

    return () => clearInterval(interval);
  }, []);

  const startFlipping = () => {
    interval = setInterval(() => {
      setCards((prevCards: Card[]) => {
        const newArray = [...prevCards]; // create a copy of the array
        newArray.unshift(newArray.pop()!); // move the last element to the front
        return newArray;
      });
    }, 5000);
  };

  const onChangeCardByIndex = (index) => {
    const item = cards.at(index);
    setCards([item, ...cards.slice(0, index), ...cards.slice(index + 1)]);
  };

  const onChangeCard = (item) => {
    const index = cards.findIndex((card) => card.id === item.id);
    setCards([item, ...cards.slice(0, index), ...cards.slice(index + 1)]);
  };

  // TODO: Get screen width
  return (
    <div
      className="relative z-10 h-[220px] w-[331px] md:h-[670px] md:w-[1031px]"
      onMouseEnter={() => clearInterval(interval)}
    >
      {cards.map((card, index) => {
        return (
          <motion.div
            key={card.id}
            className="absolute flex h-[220px] w-[331px] flex-col justify-between md:h-[670px] md:w-[1031px]"
            style={{
              transformOrigin: "top center",
              display: index > 2 ? "none" : "block",
            }}
            whileHover={{
              top: index > 0 && index > 0 && index * -CARD_OFFSET - 30,
              transition: { duration: 0.3 },
            }}
            animate={{
              top: index * -CARD_OFFSET,
              scale: 1 - index * SCALE_FACTOR, // decrease scale for cards that are behind
              zIndex: cards.length - index, //  decrease z-index for the cards that are behind
            }}
            onMouseEnter={() => clearInterval(interval)}
          >
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="absolute left-[8px] top-[75px] z-20 h-[20px] w-[35px]"
                    onClick={() => onChangeCard(cards.find((c) => c.id === 1))}
                  >
                    <span className="sr-only">Overview</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="rounded-sm px-3 py-1"
                  sideOffset={8}
                >
                  <p className="text-xs">Overview</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="absolute left-[8px] top-[105px] z-20 h-[20px] w-[35px]"
                    onClick={() => onChangeCard(cards.find((c) => c.id === 5))}
                  >
                    <span className="sr-only">Transactions</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="rounded-sm px-3 py-1"
                  sideOffset={8}
                >
                  <p className="text-xs">Transactions</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="absolute left-[8px] top-[135px] z-20 h-[20px] w-[35px]"
                    onClick={() => onChangeCard(cards.find((c) => c.id === 3))}
                  >
                    <span className="sr-only">Inbox</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="rounded-sm px-3 py-1"
                  sideOffset={8}
                >
                  <p className="text-xs">Inbox</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="absolute left-[8px] top-[170px] z-20 h-[20px] w-[35px]"
                    onClick={() => onChangeCard(cards.find((c) => c.id === 2))}
                  >
                    <span className="sr-only">Tracker</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="rounded-sm px-3 py-1"
                  sideOffset={8}
                >
                  <p className="text-xs">Tracker</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="absolute left-[8px] top-[230px] z-20 h-[20px] w-[35px]"
                    onClick={() => onChangeCard(cards.find((c) => c.id === 4))}
                  >
                    <span className="sr-only">Vault</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="rounded-sm px-3 py-1"
                  sideOffset={8}
                >
                  <p className="text-xs">Vault</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div onClick={() => onChangeCardByIndex(index)}>{card.content}</div>
          </motion.div>
        );
      })}
    </div>
  );
};
