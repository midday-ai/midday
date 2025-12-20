import type { ReactNode } from "react";

interface MainContentProps {
  children: ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  return (
    <div
      className="px-4 md:px-8 transition-transform duration-200"
      style={{
        transform: "translateY(calc(var(--header-offset, 0px) * -1))",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
