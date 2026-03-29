"use client";

import { Icons } from "@midday/ui/icons";
import { formatISO } from "date-fns";
import { useRouter } from "next/navigation";
import { useInboxUpload } from "@/hooks/use-inbox-upload";

const SHEET_ACTIONS = [
  {
    label: "Create Invoice",
    icon: Icons.Invoice,
    params: { type: "create" },
  },
  {
    label: "Add Transaction",
    icon: Icons.CreateTransaction,
    params: { createTransaction: "true" },
  },
  {
    label: "Add Customer",
    icon: Icons.Customers,
    params: { createCustomer: "true" },
  },
] as const;

export function QuickActions() {
  const router = useRouter();
  const { openFilePicker } = useInboxUpload();

  const openSheet = (params: Record<string, string>) => {
    const search = new URLSearchParams(params).toString();
    router.push(`?${search}`, { scroll: false });
  };

  return (
    <div className="flex items-center justify-center gap-3 pt-2 pb-12 w-full flex-wrap">
      {SHEET_ACTIONS.map(({ label, icon: Icon, params }) => (
        <button
          key={label}
          type="button"
          className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs text-muted-foreground/60 hover:text-foreground hover:border-primary/30 transition-colors cursor-pointer"
          onClick={() => openSheet(params)}
        >
          <Icon size={13} className="text-muted-foreground/40" />
          <span>{label}</span>
        </button>
      ))}

      <button
        type="button"
        className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs text-muted-foreground/60 hover:text-foreground hover:border-primary/30 transition-colors cursor-pointer"
        onClick={() =>
          openSheet({
            selectedDate: formatISO(new Date(), { representation: "date" }),
          })
        }
      >
        <Icons.Tracker size={13} className="text-muted-foreground/40" />
        <span>Track Time</span>
      </button>

      <button
        type="button"
        className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs text-muted-foreground/60 hover:text-foreground hover:border-primary/30 transition-colors cursor-pointer"
        onClick={openFilePicker}
      >
        <Icons.Inbox2 size={13} className="text-muted-foreground/40" />
        <span>Upload Receipt</span>
      </button>
    </div>
  );
}
