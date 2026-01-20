"use client";

import { useI18n } from "@/locales/client";
import { cn } from "@midday/ui/cn";

type ExpenseApprovalStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "paid";

const statusStyles: Record<
  ExpenseApprovalStatus,
  { bg: string; text: string; darkBg: string; darkText: string }
> = {
  draft: {
    bg: "bg-[#F2F1EF]",
    text: "text-[#606060]",
    darkBg: "dark:bg-[#1D1D1D]",
    darkText: "dark:text-[#878787]",
  },
  pending: {
    bg: "bg-[#FFF3CD]",
    text: "text-[#856404]",
    darkBg: "dark:bg-[#433A1C]",
    darkText: "dark:text-[#FFD93D]",
  },
  approved: {
    bg: "bg-[#D4EDDA]",
    text: "text-[#155724]",
    darkBg: "dark:bg-[#1E3A2F]",
    darkText: "dark:text-[#75B798]",
  },
  rejected: {
    bg: "bg-[#F8D7DA]",
    text: "text-[#721C24]",
    darkBg: "dark:bg-[#3A1E20]",
    darkText: "dark:text-[#EA868F]",
  },
  paid: {
    bg: "bg-[#D1ECF1]",
    text: "text-[#0C5460]",
    darkBg: "dark:bg-[#1C3A40]",
    darkText: "dark:text-[#6EDFF6]",
  },
};

interface ExpenseApprovalStatusProps {
  status: ExpenseApprovalStatus;
  className?: string;
}

export function ExpenseApprovalStatus({
  status,
  className,
}: ExpenseApprovalStatusProps) {
  const t = useI18n();
  const styles = statusStyles[status];

  const labelMap: Record<ExpenseApprovalStatus, string> = {
    draft: t("expense_approval.status.draft"),
    pending: t("expense_approval.status.pending"),
    approved: t("expense_approval.status.approved"),
    rejected: t("expense_approval.status.rejected"),
    paid: t("expense_approval.status.paid"),
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        styles.bg,
        styles.text,
        styles.darkBg,
        styles.darkText,
        className,
      )}
    >
      {labelMap[status]}
    </span>
  );
}
