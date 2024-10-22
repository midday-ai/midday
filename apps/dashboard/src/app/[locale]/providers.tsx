"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { I18nProviderClient } from "@/locales/client";
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
import { TriggerProvider } from "@trigger.dev/react";
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type { ReactNode } from "react";

// We need to import it here because this is the first
// client component
if (isDesktopApp()) {
  require("@/desktop/main");
}

type ProviderProps = {
  locale: string;
  children: ReactNode;
};

export function Providers({ locale, children }: ProviderProps) {
  return (
    <I18nProviderClient locale={locale}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TriggerProvider
          publicApiKey={process.env.NEXT_PUBLIC_TRIGGER_API_KEY!}
          apiUrl={process.env.NEXT_PUBLIC_TRIGGER_API_URL}
        >
          <NuqsAdapter>
            {children}
          </NuqsAdapter>
        </TriggerProvider>
      </ThemeProvider>
    </I18nProviderClient>
  );
}
