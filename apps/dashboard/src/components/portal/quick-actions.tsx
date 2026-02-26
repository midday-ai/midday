"use client";

import { Icons } from "@midday/ui/icons";
import Link from "next/link";

type Props = {
  portalId: string;
};

const actions = [
  {
    href: "/payoff",
    label: "Request Payoff",
    Icon: Icons.CurrencyOutline,
    description: "Get your payoff amount",
  },
  {
    href: "/payments",
    label: "Payment History",
    Icon: Icons.ReceiptLong,
    description: "View all payments",
  },
  {
    href: "/documents",
    label: "Documents",
    Icon: Icons.Folder,
    description: "Contracts & statements",
  },
  {
    href: "/help",
    label: "Get Help",
    Icon: Icons.InfoOutline,
    description: "FAQs & contact",
  },
];

export function QuickActions({ portalId }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map(({ href, label, Icon, description }) => (
        <Link
          key={href}
          href={`/p/${portalId}${href}`}
          className="flex items-center gap-3 p-4 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors min-h-[64px]"
        >
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 flex-shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium">{label}</div>
            <div className="text-[11px] text-muted-foreground truncate">
              {description}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
