import type { ReactNode } from "react";

interface ScrollableContentProps {
  children: ReactNode;
}

/**
 * Wrapper component that responds to scroll-to-hide header behavior.
 * Use this to wrap content that should move up when the header hides on scroll.
 * Used primarily for table pages (transactions, invoices, etc.)
 */
export function ScrollableContent({ children }: ScrollableContentProps) {
  return (
    <div
      className="transition-transform"
      style={{
        transform: "translateY(calc(var(--header-offset, 0px) * -1))",
        transitionDuration: "var(--header-transition, 200ms)",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
