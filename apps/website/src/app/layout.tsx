import "@/styles/globals.css";
import { cn } from "@midday/ui/cn";
import "@midday/ui/globals.css";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { NewVersionChecker } from "@/components/new-version-toast";
import { StatsigProvider } from "@/components/statsig-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@midday/ui/toaster";
import { Provider as Analytics } from "@midday/events/client";
import type { Metadata } from "next";
import { Hedvig_Letters_Sans, Hedvig_Letters_Serif } from "next/font/google";
import type { ReactElement } from "react";
import { baseUrl } from "./sitemap";

const hedvigSans = Hedvig_Letters_Sans({
  weight: "400",
  subsets: ["latin"],
  display: "optional",
  variable: "--font-hedvig-sans",
  preload: true,
  adjustFontFallback: true,
  fallback: ["system-ui", "arial"],
});

const hedvigSerif = Hedvig_Letters_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "optional",
  variable: "--font-hedvig-serif",
  preload: true,
  adjustFontFallback: true,
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Abacus",
    template: "%s | Abacus",
  },
  description:
    "Abacus is the operating system for funding businesses. Connect your Google Sheet and get a professional dashboard, risk alerts, and branded merchant portal.",
  openGraph: {
    title: "Abacus",
    description:
      "Abacus is the operating system for funding businesses. Connect your Google Sheet and get a professional dashboard, risk alerts, and branded merchant portal.",
    url: baseUrl,
    siteName: "Abacus",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://cdn.midday.ai/opengraph-image-v1.jpg",
        width: 800,
        height: 600,
      },
      {
        url: "https://cdn.midday.ai/opengraph-image-v1.jpg",
        width: 1800,
        height: 1600,
      },
    ],
  },
  twitter: {
    title: "Abacus",
    description:
      "Abacus is the operating system for funding businesses. Connect your Google Sheet and get a professional dashboard, risk alerts, and branded merchant portal.",
    images: [
      {
        url: "https://cdn.midday.ai/opengraph-image-v1.jpg",
        width: 800,
        height: 600,
      },
      {
        url: "https://cdn.midday.ai/opengraph-image-v1.jpg",
        width: 1800,
        height: 1600,
      },
    ],
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
  themeColor: [
    { media: "(prefers-color-scheme: light)" },
    { media: "(prefers-color-scheme: dark)" },
  ],
};

export default function Layout({ children }: { children: ReactElement }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.midday.ai" />
        <link rel="dns-prefetch" href="https://cdn.midday.ai" />
      </head>
      <body
        className={cn(
          `${hedvigSans.variable} ${hedvigSerif.variable} font-sans`,
          "bg-background overflow-x-hidden font-sans antialiased",
        )}
      >
        <StatsigProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Header />
            <main className="container mx-auto px-4 overflow-hidden md:overflow-visible">
              {children}
            </main>
            <Footer />
            <Analytics />
            <Toaster />
            <NewVersionChecker />
          </ThemeProvider>
        </StatsigProvider>
      </body>
    </html>
  );
}
