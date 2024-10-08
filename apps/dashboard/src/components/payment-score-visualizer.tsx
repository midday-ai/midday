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
            color = "bg-yellow-500";
            break;
          case "bad":
            color = "bg-red-500";
            break;
          default:
            color = "bg-primary";
        }
        return (
          <motion.div
            key={index.toString()}
            className={`w-1 ${color} h-[27px] ${index < score ? "opacity-100" : "opacity-30"}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            style={{ originX: 0 }}
          />
        );
      })}
    </div>
  );
}
