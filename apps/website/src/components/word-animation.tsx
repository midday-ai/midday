"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const words = [
  "Freelancers",
  "Agencies",
  "Consultants",
  "Startups",
  "Entrepreneurs",
  "Founders",
];

function useWordCycle(words: string[], interval: number) {
  const [index, setIndex] = useState(0);
  const [isInitial, setIsInitial] = useState(true);

  useEffect(() => {
    if (isInitial) {
      setIsInitial(false);
      return;
    }

    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % words.length);
    }, interval);
    return () => clearInterval(timer);
  }, [words, interval, isInitial]);

  return words[index];
}
export function WordAnimation() {
  const word = useWordCycle(words, 2100);

  return (
    <AnimatePresence mode="wait">
      <motion.div key={word} className="text-primary inline-block">
        {word?.split("").map((char, index) => (
          <motion.span
            key={`${word}-${char}-${index.toString()}`}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{
              duration: 0.15,
              delay: index * 0.015,
              ease: "easeOut",
            }}
            style={{ display: "inline-block", whiteSpace: "pre" }}
          >
            {char}
          </motion.span>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
