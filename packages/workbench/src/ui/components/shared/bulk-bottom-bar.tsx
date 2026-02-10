"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MoreVertical, RotateCcw, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { JobStatus } from "@/core/types";
import { cn } from "@/lib/utils";
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
                className="absolute inset-0 backdrop-blur-xl bg-background/70 shadow-lg border border-border/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />

              {/* Content */}
              <div className="relative h-12 flex items-center justify-between px-4">
                <span className="text-xs text-foreground">
                  {selection.length} selected
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    disabled={isLoading}
                    className="text-xs text-muted-foreground hover:text-foreground hover:bg-transparent"
                  >
                    Deselect all
                  </Button>

                  {(onPromote && hasDelayedJobs) ||
                  (onRetry && hasFailedJobs) ||
                  onDelete ? (
                    <MoreVertical className="h-3 w-3 text-muted-foreground/50" />
                  ) : null}

                  {onPromote && hasDelayedJobs && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onPromote}
                        disabled={isLoading}
                        className="text-xs text-muted-foreground hover:text-foreground hover:bg-transparent"
                      >
                        {isPromoting ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <Zap className="mr-1 h-3 w-3" />
                        )}
                        Promote
                        {delayedCount < selection.length &&
                          ` (${delayedCount})`}
                      </Button>
                      {(onRetry && hasFailedJobs) || onDelete ? (
                        <MoreVertical className="h-3 w-3 text-muted-foreground/50" />
                      ) : null}
                    </>
                  )}

                  {onRetry && hasFailedJobs && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRetry}
                        disabled={isLoading}
                        className="text-xs text-muted-foreground hover:text-foreground hover:bg-transparent"
                      >
                        {isRetrying ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <RotateCcw className="mr-1 h-3 w-3" />
                        )}
                        Retry
                        {failedCount < selection.length && ` (${failedCount})`}
                      </Button>
                      {onDelete ? (
                        <MoreVertical className="h-3 w-3 text-muted-foreground/50" />
                      ) : null}
                    </>
                  )}

                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onDelete}
                      disabled={isLoading}
                      className="text-xs text-muted-foreground hover:text-foreground hover:bg-transparent"
                    >
                      {isDeleting ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="mr-1 h-3 w-3" />
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
