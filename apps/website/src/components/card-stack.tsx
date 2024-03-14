"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

let interval: any;

type Card = {
  id: number;
  name: string;
  designation: string;
  content: React.ReactNode;
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
  const CARD_OFFSET = offset || 10;
  const SCALE_FACTOR = scaleFactor || 0.06;
  const [cards, setCards] = useState<Card[]>(items);

  useEffect(() => {
    // startFlipping();

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

  return (
    <div className="relative h-[670px] w-[1031px]">
      {cards.map((card, index) => {
        return (
          <motion.div
            key={card.id}
            className="absolute h-[670px] w-[1031px] flex flex-col justify-between"
            style={{
              transformOrigin: "top center",
            }}
            animate={{
              top: index * -CARD_OFFSET,
              scale: 1 - index * SCALE_FACTOR, // decrease scale for cards that are behind
              zIndex: cards.length - index, //  decrease z-index for the cards that are behind
            }}
          >
            <Image
              quality={100}
              alt="Dashboard - Overview"
              src={require("public/screen-1.png")}
              width={1031}
              height={670}
            />
          </motion.div>
        );
      })}
    </div>
  );
};
