"use client";

import { Button } from "@midday/ui/button";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Portal } from "@/components/portal";

interface BottomBarProps {
  /** Number of selected items */
  selectedCount: number;
  /** Callback to deselect all items */
  onDeselect: () => void;
  /** Action buttons to render on the right side */
  children: ReactNode;
}

/**
 * Generic bottom bar for table multi-select actions
 * Appears at the bottom of the screen when items are selected
 */
export function BottomBar({
  selectedCount,
  onDeselect,
  children,
}: BottomBarProps) {
  return (
    <Portal>
      <motion.div
        className="h-12 fixed bottom-6 left-0 right-0 pointer-events-none flex justify-center z-50"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="relative pointer-events-auto min-w-[400px] h-12">
          {/* Blur layer fades in separately to avoid backdrop-filter animation issues */}
          <motion.div
            className="absolute inset-0 backdrop-filter backdrop-blur-lg bg-[rgba(247,247,247,0.85)] dark:bg-[rgba(19,19,19,0.7)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
          <div className="relative h-12 justify-between items-center flex pl-4 pr-2">
            <span className="text-sm">{selectedCount} selected</span>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                className="text-muted-foreground"
                onClick={onDeselect}
              >
                <span>Deselect all</span>
              </Button>

              {children}
            </div>
          </div>
        </div>
      </motion.div>
    </Portal>
  );
}
