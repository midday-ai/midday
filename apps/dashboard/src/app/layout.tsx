// import { SystemBanner } from "@/components/system-banner";
import "@/styles/globals.css";
import { LogSnagProvider } from "@midday/events/client";
import { cn } from "@midday/ui/cn";
import "@midday/ui/globals.css";
import { Toaster } from "@midday/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import type { ReactElement } from "react";

export const metadata: Metadata = {
  metadataBase: new URL("https://app.midday.ai"),
  title: "Midday | Run your business smarter",
  description:
    "Automate financial tasks, stay organized, and make informed decisions effortlessly.",
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)" },
    { media: "(prefers-color-scheme: dark)" },
  ],
};

export const preferredRegion = ["fra1", "sfo1"];

export default function Layout({
  children,
  params,
}: {
  children: ReactElement;
  params: { locale: string };
}) {
  return (
    <html lang={params.locale} suppressHydrationWarning>
      <head>
        <LogSnagProvider
          token={process.env.NEXT_PUBLIC_LOGSNAG_TOKEN!}
          project={process.env.NEXT_PUBLIC_LOGSNAG_PROJECT!}
        />
      </head>
      <body
        className={cn(
          `${GeistSans.variable} ${GeistMono.variable}`,
          "whitespace-pre-line overscroll-none"
        )}
      >
        {/* <SystemBanner /> */}
        {children}
        <SpeedInsights />
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
