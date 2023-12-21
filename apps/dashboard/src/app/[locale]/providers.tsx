"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { I18nProviderClient } from "@/locales/client";
import { TriggerProvider } from "@trigger.dev/react";
import { ReactNode } from "react";

type ProviderProps = {
  locale: string;
  children: ReactNode;
};

export function Providers({ locale, children }: ProviderProps) {
  return (
    <I18nProviderClient locale={locale} fallback={<div />}>
      <TriggerProvider
        publicApiKey={process.env.NEXT_PUBLIC_TRIGGER_API_KEY!}
        apiUrl={process.env.NEXT_PUBLIC_TRIGGER_API_URL}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </TriggerProvider>
    </I18nProviderClient>
  );
}
