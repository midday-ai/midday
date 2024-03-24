"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type ProviderProps = {
  children: ReactNode;
};

export function Provider({ children }: ProviderProps) {
  const pathname = usePathname();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      forcedTheme={pathname.includes("engine") ? "dark" : undefined}
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
