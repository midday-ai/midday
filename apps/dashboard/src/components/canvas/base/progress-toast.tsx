"use client";

import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Spinner } from "@midday/ui/spinner";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ProgressToastProps {
  isVisible: boolean;
  currentStep?: number;
  totalSteps?: number;
  currentLabel?: string;
  completed?: boolean;
  completedMessage?: string;
  onComplete?: () => void;
}

const containerVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
};

const contentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
  },
};

export function ProgressToast({
  isVisible,
  currentStep = 0,
  totalSteps = 6,
  currentLabel,
  completed = false,
  completedMessage,
  onComplete,
}: ProgressToastProps) {
  const [showComplete, setShowComplete] = useState(false);
  const [shouldStayVisible, setShouldStayVisible] = useState(false);

  useEffect(() => {
    if (!isVisible && !shouldStayVisible) {
      setShowComplete(false);
      return;
    }

    // Show complete state when all steps are done or completed is true
    if (currentStep >= totalSteps || completed) {
      setShouldStayVisible(true);
      // Show the last step for a shorter duration before showing completion
      const timer = setTimeout(() => {
        setShowComplete(true);
        // After showing completion for 1.5 seconds, allow hiding
        setTimeout(() => {
          setShouldStayVisible(false);
          onComplete?.();
        }, 1500);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [
    isVisible,
    currentStep,
    totalSteps,
    completed,
    onComplete,
    shouldStayVisible,
  ]);

  return (
    <AnimatePresence>
      {(isVisible || shouldStayVisible) && (
        <motion.div
          className="absolute bottom-4 left-4 right-4 z-50"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{
            duration: 0.2,
            ease: "easeOut",
          }}
        >
          <motion.div
            className={cn(
              "bg-white dark:bg-[#0c0c0c] border border-[#e6e6e6] dark:border-[#1d1d1d] p-3",
              "backdrop-blur-sm",
            )}
            variants={contentVariants}
            transition={{
              duration: 0.2,
              delay: 0.1,
            }}
          >
            {showComplete ? (
              <div className="flex items-center gap-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                  }}
                >
                  <Icons.Check
                    size={16}
                    className="text-black dark:text-white"
                  />
                </motion.div>
                <div>
                  <p className="text-[12px] leading-[17px] text-black dark:text-white">
                    {completedMessage || "Analysis complete"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {/* Loading Spinner */}
                    <Spinner size={16} className="text-[#878787]" />
                    <span className="text-[12px] leading-[17px] text-black dark:text-white">
                      {currentLabel || "Processing..."}
                    </span>
                  </div>
                  <span className="text-[12px] leading-[17px] text-[#707070] dark:text-[#666666]">
                    {currentStep + 1}/{totalSteps}
                  </span>
                </div>
                <div className="pl-6">
                  <span className="text-[12px] leading-[17px] text-[#707070] dark:text-[#666666]">
                    Computing
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
