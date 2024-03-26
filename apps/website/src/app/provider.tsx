"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type ProviderProps = {
  children: ReactNode;
};

export function Provider({ children }: ProviderProps) {
  const pathname = usePathname();
  const isDarkPath = pathname.includes("engine") || pathname.includes("pitch");
  const theme = isDarkPath ? "dark" : undefined;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      forcedTheme={theme}
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
