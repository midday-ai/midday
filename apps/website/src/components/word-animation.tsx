"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const words = [
  "Freelancer",
  "Agencies",
  "Consultants",
  "Startup",
  "Entrepreneurs",
];

function useWordCycle(words: string[], interval: number) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % words.length);
    }, interval);
    return () => clearInterval(timer);
  }, [words, interval]);

  return words[index];
}

export function WordAnimation() {
  const word = useWordCycle(words, 4500);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={word}
        initial={{ y: 20, opacity: 0 }}
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
