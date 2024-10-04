"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { I18nProviderClient } from "@/locales/client";
import StoreProvider from "@/provider/backend-provider";
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
import { TriggerProvider } from "@trigger.dev/react";
import type { ReactNode } from "react";

// We need to import it here because this is the first
// client component
if (isDesktopApp()) {
  require("@/desktop/main");
}

type ProviderProps = {
  locale: string;
  children: ReactNode;
  userId: string;
  accessToken: string;
  email: string;
};

export function Providers({ locale, children, userId, email, accessToken }: ProviderProps) {
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
          <StoreProvider
          userId={userId}
          accessToken={accessToken}
          email={email}
        >
            {children}
          </StoreProvider>
        </ThemeProvider>
      </TriggerProvider>
    </I18nProviderClient>
  );
}
