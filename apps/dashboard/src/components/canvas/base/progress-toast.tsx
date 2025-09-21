"use client";

import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Spinner } from "@midday/ui/spinner";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

interface ProgressToastProps {
  isVisible: boolean;
  currentStep?: number;
  totalSteps?: number;
  currentLabel?: string;
  stepDescription?: string;
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
  stepDescription,
  completed = false,
  completedMessage,
  onComplete,
}: ProgressToastProps) {
  const [showComplete, setShowComplete] = useState(false);
  const [shouldStayVisible, setShouldStayVisible] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [displayedStep, setDisplayedStep] = useState(currentStep);
  const [displayedLabel, setDisplayedLabel] = useState(currentLabel);
  const [displayedDescription, setDisplayedDescription] =
    useState(stepDescription);
  const hasHandledCompletion = useRef(false);
  const prevVisible = useRef(isVisible);
  const stepTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stepQueueRef = useRef<
    Array<{ step: number; label?: string; description?: string }>
  >([]);
  const isProcessingQueueRef = useRef(false);

  // Process the step queue sequentially
  const processStepQueue = useCallback(() => {
    if (isProcessingQueueRef.current || stepQueueRef.current.length === 0) {
      return;
    }

    isProcessingQueueRef.current = true;
    const nextStep = stepQueueRef.current.shift();

    if (nextStep) {
      setDisplayedStep(nextStep.step);
      setDisplayedLabel(nextStep.label);
      setDisplayedDescription(nextStep.description);

      // Schedule next step after minimum duration
      stepTimeoutRef.current = setTimeout(() => {
        isProcessingQueueRef.current = false;
        processStepQueue(); // Process next step in queue
      }, 800); // 800ms minimum per step
    } else {
      isProcessingQueueRef.current = false;
    }
  }, []);

  // Add step to queue when props change
  useEffect(() => {
    if (isVisible && !completed) {
      // Add to queue if it's a new step
      const lastQueuedStep =
        stepQueueRef.current[stepQueueRef.current.length - 1];
      if (!lastQueuedStep || lastQueuedStep.step !== currentStep) {
        stepQueueRef.current.push({
          step: currentStep,
          label: currentLabel,
          description: stepDescription,
        });

        // Start processing if not already processing
        if (!isProcessingQueueRef.current) {
          processStepQueue();
        }
      }
    }
  }, [
    currentStep,
    currentLabel,
    stepDescription,
    isVisible,
    completed,
    processStepQueue,
  ]);

  // Initialize displayed values
  useEffect(() => {
    if (isVisible) {
      setDisplayedStep(currentStep);
      setDisplayedLabel(currentLabel);
      setDisplayedDescription(stepDescription);
      stepQueueRef.current = []; // Clear queue on visibility change
      isProcessingQueueRef.current = false;
    }
  }, [isVisible]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (stepTimeoutRef.current) {
        clearTimeout(stepTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Show completion when completed is true and not already handled
    if (completed && !hasHandledCompletion.current) {
      hasHandledCompletion.current = true;
      setIsCompleting(true);
      setShouldStayVisible(true);
      setShowComplete(true);

      // Auto-hide after showing completion for 3 seconds
      setTimeout(() => {
        setShouldStayVisible(false);
        setShowComplete(false);
        setIsCompleting(false);
        // Don't reset hasHandledCompletion - keep it true to prevent re-showing
        onComplete?.();
      }, 3000);

      // Don't clear the timer on subsequent effect runs
      return;
    }

    // Reset when not visible and not completing
    if (!isVisible && !shouldStayVisible && !isCompleting) {
      setShowComplete(false);
      hasHandledCompletion.current = false;
      setIsCompleting(false);
    }

    // Update previous visible state
    prevVisible.current = isVisible;
  }, [isVisible, completed, onComplete, shouldStayVisible, isCompleting]);

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
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Loading Spinner */}
                    <Spinner size={16} className="text-[#878787]" />
                    <span className="text-[12px] leading-[17px] text-black dark:text-white">
                      {displayedLabel || "Processing..."}
                    </span>
                  </div>
                  <span className="text-[12px] leading-[17px] text-[#707070] dark:text-[#666666]">
                    {displayedStep + 1}/{totalSteps}
                  </span>
                </div>
                <div className="pl-6">
                  <span className="text-[12px] leading-[17px] text-[#707070] dark:text-[#666666]">
                    {displayedDescription || "Computing"}
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
