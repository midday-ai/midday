"use client";
import { ThemeProvider } from "@/components/theme-provider";
import { PostHogReactProvider } from '@/lib/posthog/react';
import { I18nProviderClient } from "@/locales/client";
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
import { TriggerProvider } from "@trigger.dev/react";
import { NextSSRPlugin } from '@uploadthing/react/next-ssr-plugin';
import { extractRouterConfig } from 'uploadthing/server';
import { fileRouter } from '../api/uploadthing/core';

import dynamic from 'next/dynamic';
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

const PostHogPageView = dynamic(() => import('@/lib/posthog/view'), {
  ssr: false,
})

export function Providers({ locale, children }: ProviderProps) {
  return (
    <I18nProviderClient locale={locale}>
      <TriggerProvider
        publicApiKey={process.env.NEXT_PUBLIC_TRIGGER_API_KEY!}
        apiUrl={process.env.NEXT_PUBLIC_TRIGGER_API_URL}
      >
        <PostHogReactProvider>
        <NextSSRPlugin routerConfig={extractRouterConfig(fileRouter)} />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
            <PostHogPageView />

          {children}
        </ThemeProvider>
        </PostHogReactProvider>
      </TriggerProvider>
    </I18nProviderClient>
  );
}
