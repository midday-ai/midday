import type * as React from "react";
import { cn } from "@/lib/utils";

interface ShellProps {
  children: React.ReactNode;
  className?: string;
}

export function Shell({ children, className }: ShellProps) {
  return (
    <div className={cn("flex h-screen bg-background", className)}>
      {children}
    </div>
  );
}

interface ShellSidebarProps {
  children: React.ReactNode;
  collapsed?: boolean;
}

export function ShellSidebar({ children, collapsed }: ShellSidebarProps) {
  return (
    <aside
      className={cn(
        "border-r border-border bg-card flex flex-col transition-all duration-200",
        collapsed ? "w-14" : "w-56",
      )}
    >
      {children}
    </aside>
  );
}

export function ShellContent({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
  );
}

export function ShellHeader({ children }: { children: React.ReactNode }) {
  return (
    <header className="h-14 border-b border-border flex items-center px-6 gap-4 shrink-0">
      {children}
    </header>
  );
}

export function ShellMain({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 overflow-auto p-6">{children}</div>;
}
