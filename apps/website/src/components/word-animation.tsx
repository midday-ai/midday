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
  const word = useWordCycle(words, 4500);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={word}
        initial={false}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        transition={{ duration: 0.1 }}
        className="text-white"
      >
        {word}
      </motion.span>
    </AnimatePresence>
  );
}
