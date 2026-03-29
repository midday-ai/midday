"use client";

import { Icons } from "@midday/ui/icons";
import { UploadIcon } from "lucide-react";
import Link from "next/link";

export function QuickActions() {
  return (
    <div className="flex items-center justify-center gap-6 pb-10 w-full">
      <Link
        href="/invoices?type=create"
        className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
      >
        <Icons.Invoice size={14} />
        <span>Create Invoice</span>
      </Link>
      <Link
        href="/inbox"
        className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
      >
        <UploadIcon size={14} />
        <span>Upload Receipt</span>
      </Link>
      <Link
        href="/tracker"
        className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
      >
        <Icons.Time size={14} />
        <span>Start Timer</span>
      </Link>
    </div>
  );
}
