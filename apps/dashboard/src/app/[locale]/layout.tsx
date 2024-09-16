// import { SystemBanner } from "@/components/system-banner";
import "@/styles/globals.css";
import { Provider as Analytics } from "@midday/events/client";
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
  metadataBase: new URL("https://app.midday.ai"),
  title: "Midday | Run your business smarter",
  description:
    "Automate financial tasks, stay organized, and make informed decisions effortlessly.",
  twitter: {
    title: "Midday | Run your business smarter",
    description:
      "Automate financial tasks, stay organized, and make informed decisions effortlessly.",
    images: [
      {
        url: "https://cdn.midday.ai/opengraph-image.jpg",
        width: 800,
        height: 600,
      },
      {
        url: "https://cdn.midday.ai/opengraph-image.jpg",
        width: 1800,
        height: 1600,
      },
    ],
  },
  openGraph: {
    title: "Midday | Run your business smarter",
    description:
      "Automate financial tasks, stay organized, and make informed decisions effortlessly.",
    url: "https://app.midday.ai",
    siteName: "Midday",
    images: [
      {
        url: "https://cdn.midday.ai/opengraph-image.jpg",
        width: 800,
        height: 600,
      },
      {
        url: "https://cdn.midday.ai/opengraph-image.jpg",
        width: 1800,
        height: 1600,
      },
    ],
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

export default function Layout({
  children,
  params: { locale },
}: {
  children: ReactElement;
  params: { locale: string };
}) {
  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={cn(
          `${GeistSans.variable} ${GeistMono.variable}`,
          "whitespace-pre-line overscroll-none scrollbar-hide",
        )}
      >
        {/* <SystemBanner /> */}
        <Providers locale={locale}>{children}</Providers>

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
