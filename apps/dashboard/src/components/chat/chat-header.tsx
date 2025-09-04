"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  title?: string;
};

export function ChatHeader({ title }: Props) {
  const router = useRouter();
  const [displayedTitle, setDisplayedTitle] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!title) {
      setDisplayedTitle("");
      return;
    }

    setIsAnimating(true);
    setDisplayedTitle("");

    // Calculate center position and create animation sequence
    const titleLength = title.length;
    const centerIndex = Math.floor(titleLength / 2);

    // Create sequence of characters to reveal from center outward
    const revealSequence: Array<{ char: string; index: number }> = [];

    // Add center character first
    if (titleLength > 0) {
      revealSequence.push({ char: title[centerIndex], index: centerIndex });
    }

    // Add characters alternating left and right from center
    for (
      let i = 1;
      i <= Math.max(centerIndex, titleLength - centerIndex - 1);
      i++
    ) {
      // Add left character
      if (centerIndex - i >= 0) {
        revealSequence.push({
          char: title[centerIndex - i],
          index: centerIndex - i,
        });
      }
      // Add right character
      if (centerIndex + i < titleLength) {
        revealSequence.push({
          char: title[centerIndex + i],
          index: centerIndex + i,
        });
      }
    }

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex >= revealSequence.length) {
        setIsAnimating(false);
        clearInterval(interval);
        return;
      }

      setDisplayedTitle((prev) => {
        const chars = Array(titleLength).fill(" ");

        // Fill in all characters up to current index
        for (let i = 0; i <= currentIndex && i < revealSequence.length; i++) {
          const { char, index } = revealSequence[i];
          chars[index] = char;
        }

        return chars.join("");
      });

      currentIndex++;
    }, 80); // Adjust timing as needed

    return () => clearInterval(interval);
  }, [title]);

  if (!title) return null;

  return (
    <div className="flex items-center justify-between px-8 py-6 transition-all duration-300 w-full">
      <Button variant="outline" size="icon" onClick={() => router.back()}>
        <Icons.ArrowBack size={16} />
      </Button>
      <motion.h1
        className="text-primary text-sm font-regular truncate"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {displayedTitle.split("").map((char, index) => (
          <motion.span
            key={`${title}-char-${index}-${char}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: char === " " && isAnimating ? 0 : 1,
              scale: 1,
            }}
            transition={{
              duration: 0.2,
              delay: 0,
            }}
          >
            {char === " " && isAnimating ? "\u00A0" : char}
          </motion.span>
        ))}
      </motion.h1>

      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon">
          <Icons.Close size={16} />
        </Button>

        <Button variant="outline" size="icon">
          <Icons.Close size={16} />
        </Button>
      </div>
    </div>
  );
}
