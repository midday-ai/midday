"use client";

import { cn } from "@midday/ui/cn";
import { motion, stagger, useAnimate } from "framer-motion";

export const TextGenerateEffect = ({
  words,
  className,
}: {
  words: string;
  className?: string;
}) => {
  const [scope, animate] = useAnimate();
  const wordsArray = words.split(" ");

  const renderWords = () => {
    return (
      <motion.div ref={scope}>
        {wordsArray.map((word, idx) => {
          return (
            <motion.span
              key={word + idx.toString()}
              className="text-white opacity-0"
            >
              {word}{" "}
            </motion.span>
          );
        })}
      </motion.div>
    );
  };

  return (
    <motion.div
      onViewportEnter={() => {
        animate(
          "span",
          {
            opacity: 1,
          },
          {
            duration: 1,
            delay: stagger(0.13),
          }
        );
      }}
      className={cn("text-center font-medium", className)}
    >
      {renderWords()}
    </motion.div>
  );
};
