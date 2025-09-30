"use client";

import { motion } from "framer-motion";

interface PaymentScoreVisualizerProps {
  score: number;
  count?: number;
}

export function PaymentScoreVisualizer({
  score,
  count = 27,
}: PaymentScoreVisualizerProps) {
  // Calculate how many bars should be filled based on the score
  const filledBars = Math.round((score / 100) * count);

  return (
    <div className="flex items-end gap-[6px]">
      {[...Array(count)].map((_, index) => {
        const shouldFill = index < filledBars;

        return (
          <div className="relative" key={index.toString()}>
            <div className="w-[3px] h-[27px] bg-[#666] relative z-10" />
            {shouldFill && (
              <motion.div
                className="w-[3px] h-[27px] bg-primary absolute top-0 left-0 z-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.1,
                  delay: index * 0.02,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
