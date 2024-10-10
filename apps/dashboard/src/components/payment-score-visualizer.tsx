"use client";

import { motion } from "framer-motion";

interface PaymentScoreVisualizerProps {
  score: number;
  paymentStatus: "good" | "average" | "bad" | "none";
}

export function PaymentScoreVisualizer({
  score,
  paymentStatus,
}: PaymentScoreVisualizerProps) {
  return (
    <div className="flex items-end gap-[6px]">
      {[...Array(10)].map((_, index) => {
        let color: string;

        switch (paymentStatus) {
          case "good":
            color = "bg-green-500";
            break;
          case "average":
            color = "bg-primary";
            break;
          case "bad":
            color = "bg-red-500";
            break;
          default:
            color = "bg-primary";
        }
        return (
          <div className="relative" key={index.toString()}>
            <motion.div
              className={`w-1 ${color} relative z-10`}
              initial={{
                scaleY: 0,
                height: index >= 8 ? "31px" : "27px",
                y: index >= 8 ? -4 : 0,
              }}
              animate={{
                scaleY: 1,
                height: "27px",
                y: 0,
                opacity: index < score ? 1 : 0.3,
              }}
              transition={{
                duration: 0.15,
                delay: index * 0.02,
                scaleY: { duration: 0.15, delay: index * 0.02 },
                height: { duration: 0.1, delay: 0.15 + index * 0.02 },
                y: { duration: 0.1, delay: 0.15 + index * 0.02 },
                opacity: { duration: 0.1, delay: 0.15 + index * 0.02 },
              }}
              style={{ originY: 1 }}
            />
          </div>
        );
      })}
    </div>
  );
}
