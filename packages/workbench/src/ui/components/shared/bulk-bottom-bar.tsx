"use client";

import type { JobStatus } from "@/core/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, RotateCcw, Trash2, Zap } from "lucide-react";
import * as React from "react";
import { Portal } from "./portal";

export interface BulkSelection {
  queueName: string;
  jobId: string;
  status: JobStatus;
}

interface BulkBottomBarProps {
  /** Selected items */
  selection: BulkSelection[];
  /** Clear selection callback */
  onClear: () => void;
  /** Retry selected jobs (only for failed) */
  onRetry?: () => void;
  /** Delete selected jobs */
  onDelete?: () => void;
  /** Promote selected jobs (only for delayed) */
  onPromote?: () => void;
  /** Loading state for retry */
  isRetrying?: boolean;
  /** Loading state for delete */
  isDeleting?: boolean;
  /** Loading state for promote */
  isPromoting?: boolean;
  /** Optional class name */
  className?: string;
}

export function BulkBottomBar({
  selection,
  onClear,
  onRetry,
  onDelete,
  onPromote,
  isRetrying,
  isDeleting,
  isPromoting,
  className,
}: BulkBottomBarProps) {
  const isLoading = isRetrying || isDeleting || isPromoting;

  // Check what types of jobs are selected
  const hasFailedJobs = selection.some((s) => s.status === "failed");
  const hasDelayedJobs = selection.some((s) => s.status === "delayed");

  // Count by status for display
  const failedCount = selection.filter((s) => s.status === "failed").length;
  const delayedCount = selection.filter((s) => s.status === "delayed").length;

  return (
    <AnimatePresence>
      {selection.length > 0 && (
        <Portal>
          <motion.div
            className={cn(
              "fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none",
              className,
            )}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="relative pointer-events-auto min-w-[400px] h-12">
              {/* Backdrop blur layer */}
              <motion.div
                className="absolute inset-0 rounded-lg backdrop-blur-lg bg-background/85 border shadow-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />

              {/* Content */}
              <div className="relative h-12 flex items-center justify-between px-4">
                <span className="text-sm font-medium">
                  {selection.length} selected
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    disabled={isLoading}
                    className="text-muted-foreground"
                  >
                    Deselect all
                  </Button>

                  {onPromote && hasDelayedJobs && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onPromote}
                      disabled={isLoading}
                    >
                      {isPromoting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      Promote{delayedCount < selection.length && ` (${delayedCount})`}
                    </Button>
                  )}

                  {onRetry && hasFailedJobs && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onRetry}
                      disabled={isLoading}
                    >
                      {isRetrying ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="mr-2 h-4 w-4" />
                      )}
                      Retry{failedCount < selection.length && ` (${failedCount})`}
                    </Button>
                  )}

                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onDelete}
                      disabled={isLoading}
                      className="text-destructive hover:text-destructive"
                    >
                      {isDeleting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </Portal>
      )}
    </AnimatePresence>
  );
}
