"use client";

import { DesktopProvider } from "@/components/desktop-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProviderClient } from "@/locales/client";
import { TRPCReactProvider } from "@/trpc/client";
import type { ReactNode } from "react";

type ProviderProps = {
  locale: string;
  children: ReactNode;
};

export function Providers({ locale, children }: ProviderProps) {
  return (
    <TRPCReactProvider>
      <I18nProviderClient locale={locale}>
        <DesktopProvider />

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </I18nProviderClient>
    </TRPCReactProvider>
  );
}
