import { BackendClientInitializer } from "@/components/backend-client-initialize";
import "@/styles/globals.css";
import { initializeBackendClient } from "@/utils/backend";
import { Provider as Analytics } from "@midday/events/client";
import { getSession } from "@midday/supabase/cached-queries";
import { cn } from "@midday/ui/cn";
import "@midday/ui/globals.css";
import { IntercomScript } from "@midday/ui/intercom-script";
import IntercomWidget from "@midday/ui/intercom-widget";
import { Toaster } from "@midday/ui/toaster";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://solomon-ai.app"),
  title: "Solomon AI | A better way to act on your finances",
  description:
    "We extract unknown relationships from your finances and help you act on them",
  twitter: {
    title: "Solomon AI | A better way to act on your finances",
    description:
      "We extract unknown relationships from your finances and help you act on them...",
    // images: [
    //   {
    //     url: "https://cdn.midday.ai/opengraph-image.jpg",
    //     width: 800,
    //     height: 600,
    //   },
    //   {
    //     url: "https://cdn.midday.ai/opengraph-image.jpg",
    //     width: 1800,
    //     height: 1600,
    //   },
    // ],
  },
  openGraph: {
    title: "Solomon AI | A better way to act on your finances",
    description:
      "We extract unknown relationships from your finances and help you act on them.",
    url: "https://solomon-ai.app",
    siteName: "Solomon AI",
    // images: [
    //   {
    //     url: "https://cdn.midday.ai/opengraph-image.jpg",
    //     width: 800,
    //     height: 600,
    //   },
    //   {
    //     url: "https://cdn.midday.ai/opengraph-image.jpg",
    //     width: 1800,
    //     height: 1600,
    //   },
    // ],
    locale: "en_US",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)" },
    { media: "(prefers-color-scheme: dark)" },
  ],
};

export const preferredRegion = ["fra1", "sfo1", "iad1"];
export const maxDuration = 60;

// Initialize the backend client on the server side
// so backend client is initialized as soon as the app starts
initializeBackendClient();

export default async function Layout({
  children,
  params: { locale },
}: {
  children: ReactElement;
  params: { locale: string };
}) {
  const session = await getSession().catch((error) => {
    console.error("Failed to fetch session:", error);
    return null;
  });

  const userId = session?.data.session?.user?.id ?? "";
  const email = session?.data.session?.user?.email ?? "";
  const accessToken = session?.data.session?.access_token ?? "";

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={cn(
          `${GeistSans.variable} ${GeistMono.variable}`,
          "whitespace-pre-line overscroll-none scrollbar-hide",
        )}
      >
        {/**
         * We place this component here to initialize the backend client which is a singleton class when the app loads.
         * In order to work correctly it needs to reside high up on the component tree.
         */}
        <BackendClientInitializer />
        <Providers
          locale={locale}
          userId={userId}
          accessToken={accessToken}
          email={email}
        >
          {children}
        </Providers>

        <IntercomWidget
          appId={process.env.NEXT_PUBLIC_INTERCOM_APP_ID ?? "pezs7zbq"}
        />
        <IntercomScript
          appId={process.env.NEXT_PUBLIC_INTERCOM_APP_ID ?? "pezs7zbq"}
        />
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
