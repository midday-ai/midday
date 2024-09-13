import { DevMessage } from "@/components/dev-message";
import { Footer } from "@/components/footer";
import { FooterCTA } from "@/components/footer-cta";
import { Header } from "@/components/header";

import "@/styles/globals.css";

import { Provider as Analytics } from "@midday/events/client";
import { cn } from "@midday/ui/cn";

import "@midday/ui/globals.css";

import type { ReactElement } from "react";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { IntercomScript } from "@midday/ui/intercom-script";
import IntercomWidget from "@midday/ui/intercom-widget";

import { baseUrl } from "./sitemap";

const PublicBetaBanner = dynamic(
  () =>
    import("@/components/public-beta-banner").then(
      (mod) => mod.PublicBetaBanner,
    ),
  {
    ssr: false,
    loading: () => null,
  },
);

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Solomon AI | A better way to act on your finances",
    template: "%s | Solomon AI",
  },
  description:
    "Solomon AI equips you with a versatile set of financial analysis and risk management capabilities.",
  openGraph: {
    title: "Solomon AI | A better way to act on your finances",
    description:
      "Solomon AI equips you with a versatile set of financial analysis and risk management capabilities.",
    url: baseUrl,
    siteName:
      "Solomon AI equips you with a versatile set of financial analysis and risk management capabilities.",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport = {
  themeColor: [{ media: "(prefers-color-scheme: dark)" }],
};

export default function Layout({ children }: { children: ReactElement }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          `${GeistSans.variable} ${GeistMono.variable}`,
          "dark overflow-x-hidden bg-[#0C0C0C] antialiased",
        )}
      >
        <Header />
        <main className="container mx-auto overflow-hidden px-4 md:overflow-visible">
          {children}
        </main>
        <IntercomWidget
          appId={process.env.NEXT_PUBLIC_INTERCOM_APP_ID ?? "pezs7zbq"}
        />
        <IntercomScript
          appId={process.env.NEXT_PUBLIC_INTERCOM_APP_ID ?? "pezs7zbq"}
        />
        <SpeedInsights />
        <FooterCTA />
        <Footer />
        <Analytics />
        <DevMessage />
        <PublicBetaBanner />
      </body>
    </html>
  );
}
