"use client";

import { Icons } from "@midday/ui/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/home", label: "Home", Icon: Icons.DashboardCustomize },
  { href: "/payments", label: "Payments", Icon: Icons.ReceiptLong },
  { href: "/deals", label: "Deals", Icon: Icons.Description },
  { href: "/documents", label: "Docs", Icon: Icons.Folder },
  { href: "/help", label: "Help", Icon: Icons.InfoOutline },
];

type Props = {
  portalId: string;
};

export function PortalBottomNav({ portalId }: Props) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-3xl mx-auto px-2">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map(({ href, label, Icon }) => {
            const fullHref = `/p/${portalId}${href}`;
            const isActive =
              pathname?.includes(href) ||
              (href === "/home" && pathname?.endsWith(`/p/${portalId}`));

            return (
              <Link
                key={href}
                href={fullHref}
                className={`
                  flex flex-col items-center justify-center
                  py-2.5 px-1 min-h-[52px]
                  transition-colors rounded-lg
                  ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                <Icon className="h-5 w-5 mb-0.5" />
                <span className="text-[10px] font-medium leading-tight">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
