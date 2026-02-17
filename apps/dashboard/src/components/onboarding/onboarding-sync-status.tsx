"use client";

import { Icons } from "@midday/ui/icons";
import { Spinner } from "@midday/ui/spinner";
import { TextMorph } from "@midday/ui/text-morph";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInitialConnectionStatus } from "@/hooks/use-initial-connection-status";

export type BankSyncState = {
  runId: string;
  accessToken: string;
} | null;

export type InboxSyncState = {
  provider: string;
} | null;

const BANK_LABELS = [
  "Connecting bank...",
  "Fetching transactions...",
  "Categorizing transactions...",
  "Bank connected",
] as const;

const BANK_FAILED_LABEL = "Bank sync failed";

const INBOX_LABELS = [
  "Connecting inbox...",
  "Importing receipts...",
  "Inbox connected",
] as const;

function useSyncLabels({
  labels,
  isActive,
  isCompleted,
  isFailed,
}: {
  labels: readonly string[];
  isActive: boolean;
  isCompleted: boolean;
  isFailed: boolean;
}) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isActive) return;

    if (isCompleted) {
      setIndex(labels.length - 1);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    if (isFailed) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const advance = () => {
      setIndex((prev) => {
        const next = prev + 1;
        if (next >= labels.length - 1) return prev;

        timerRef.current = setTimeout(advance, 3000);
        return next;
      });
    };

    timerRef.current = setTimeout(advance, 3000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isActive, isCompleted, isFailed, labels]);

  useEffect(() => {
    if (!isActive) {
      setIndex(0);
    }
  }, [isActive]);

  return {
    label: labels[index] ?? labels[0] ?? "",
    isDone: index === labels.length - 1,
  };
}

function SyncPill({
  label,
  isDone,
  isFailed,
  stacked,
  expanded,
}: {
  label: string;
  isDone: boolean;
  isFailed: boolean;
  stacked?: boolean;
  expanded?: boolean;
}) {
  const isCollapsed = stacked && !expanded;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{
        opacity: isCollapsed ? 0.5 : 1,
        scale: isCollapsed ? 0.93 : 1,
        y: isCollapsed ? -22 : stacked ? 6 : 0,
      }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="flex justify-center"
      style={{ zIndex: stacked ? 0 : 1 }}
    >
      <div className="h-7 px-3 flex items-center gap-1.5 backdrop-blur-lg bg-[rgba(247,247,247,0.85)] dark:bg-[rgba(19,19,19,0.7)] border border-border rounded-full">
        <AnimatePresence mode="wait" initial={false}>
          {isDone ? (
            <motion.div
              key="check"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Icons.Check className="size-3" />
            </motion.div>
          ) : isFailed ? (
            <motion.div
              key="error"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <Icons.AlertCircle
                width={12}
                height={12}
                className="text-destructive"
              />
            </motion.div>
          ) : (
            <motion.div
              key="spinner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Spinner size={12} />
            </motion.div>
          )}
        </AnimatePresence>
        <TextMorph as="span" className="text-[11px]">
          {label}
        </TextMorph>
      </div>
    </motion.div>
  );
}

type Props = {
  bankSync: BankSyncState;
  inboxSync: InboxSyncState;
  onVisibilityChange?: (visible: boolean) => void;
};

export function OnboardingSyncStatus({
  bankSync,
  inboxSync,
  onVisibilityChange,
}: Props) {
  const [dismissed, setDismissed] = useState<{
    bank: boolean;
    inbox: boolean;
  }>({ bank: false, inbox: false });

  const isDebug = bankSync?.runId === "debug";

  const { status: bankStatus } = useInitialConnectionStatus({
    runId: isDebug ? undefined : bankSync?.runId,
    accessToken: isDebug ? undefined : bankSync?.accessToken,
  });

  const [debugBankCompleted, setDebugBankCompleted] = useState(false);

  useEffect(() => {
    if (isDebug && bankSync && !debugBankCompleted) {
      const timer = setTimeout(() => setDebugBankCompleted(true), 10000);
      return () => clearTimeout(timer);
    }
  }, [isDebug, bankSync, debugBankCompleted]);

  const bankActive = !!bankSync && !dismissed.bank;
  const bankCompleted = isDebug
    ? debugBankCompleted
    : bankStatus === "COMPLETED";
  const bankFailed = isDebug ? false : bankStatus === "FAILED";

  const { label: bankLabel, isDone: bankDone } = useSyncLabels({
    labels: BANK_LABELS,
    isActive: bankActive,
    isCompleted: bankCompleted,
    isFailed: bankFailed,
  });

  const inboxActive = !!inboxSync && !dismissed.inbox;

  const [inboxCompleted, setInboxCompleted] = useState(false);

  useEffect(() => {
    if (inboxActive && !inboxCompleted) {
      const timer = setTimeout(() => setInboxCompleted(true), 6000);
      return () => clearTimeout(timer);
    }
  }, [inboxActive, inboxCompleted]);

  const { label: inboxLabel, isDone: inboxDone } = useSyncLabels({
    labels: INBOX_LABELS,
    isActive: inboxActive,
    isCompleted: inboxCompleted,
    isFailed: false,
  });

  const handleDismiss = useCallback((type: "bank" | "inbox") => {
    setDismissed((prev) => ({ ...prev, [type]: true }));
  }, []);

  useEffect(() => {
    if ((bankDone || bankFailed) && bankActive) {
      const timer = setTimeout(
        () => handleDismiss("bank"),
        bankFailed ? 5000 : 2000,
      );
      return () => clearTimeout(timer);
    }
  }, [bankDone, bankFailed, bankActive, handleDismiss]);

  useEffect(() => {
    if (inboxDone && inboxActive) {
      const timer = setTimeout(() => handleDismiss("inbox"), 2000);
      return () => clearTimeout(timer);
    }
  }, [inboxDone, inboxActive, handleDismiss]);

  const showBank = bankActive;
  const showInbox = inboxActive;
  const isVisible = showBank || showInbox;

  useEffect(() => {
    onVisibilityChange?.(isVisible);
  }, [isVisible, onVisibilityChange]);

  const items: {
    key: string;
    label: string;
    isDone: boolean;
    isFailed: boolean;
  }[] = [];

  if (showBank) {
    items.push({
      key: "bank",
      label: bankFailed ? BANK_FAILED_LABEL : bankLabel,
      isDone: bankDone,
      isFailed: bankFailed,
    });
  }
  if (showInbox) {
    items.push({
      key: "inbox",
      label: inboxLabel,
      isDone: inboxDone,
      isFailed: false,
    });
  }

  const [hovered, setHovered] = useState(false);
  const hasMultiple = items.length > 1;

  return (
    <div
      className="flex flex-col items-center cursor-default"
      onMouseEnter={() => hasMultiple && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <SyncPill
            key={item.key}
            label={item.label}
            isDone={item.isDone}
            isFailed={item.isFailed}
            stacked={index > 0}
            expanded={hovered}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
