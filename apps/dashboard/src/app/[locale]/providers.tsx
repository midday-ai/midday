"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { I18nProviderClient } from "@/locales/client";
import { platform } from "@todesktop/client-core";
import { TriggerProvider } from "@trigger.dev/react";
import { ReactNode, useEffect } from "react";

type ProviderProps = {
  locale: string;
  children: ReactNode;
};

export function Providers({ locale, children }: ProviderProps) {
  useEffect(() => {
    if (window.todesktop) {
      const notification = new Notification("Invoice paid 💰", {
        body: "Your invoice for 33400 SEK just got paid!",
        sound: "./cash.mp3",
      });
    }
  }, []);

  return (
    <I18nProviderClient locale={locale}>
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
