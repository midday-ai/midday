import { StaffToolbar } from "@/components/staff-toolbar";
import "@/styles/globals.css";
import "@midday/ui/globals.css";
import { Toaster } from "@midday/ui/toaster";
import { cn } from "@midday/ui/utils";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import { type ReactElement } from "react";

const fontSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://app.midday.ai"),
  title: "Midday | The financial OS for your business",
  description:
    "Automate financial tasks, stay organized, and make informed decisions effortlessly.",
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)" },
    { media: "(prefers-color-scheme: dark)" },
  ],
};

export default function Layout({
  children,
  params,
}: {
  children: ReactElement;
  params: { locale: string };
}) {
  return (
    <html lang={params.locale} suppressHydrationWarning>
      <body
        className={cn(fontSans.variable, "whitespace-pre-line overscroll-none")}
      >
        {children}
        <SpeedInsights />
        <StaffToolbar />
        <Toaster />
      </body>
    </html>
  );
}
