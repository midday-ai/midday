import { ThemeProvider } from "@/components/theme-provider";
import "@/styles/globals.css";
import "@midday/ui/globals.css";
import { cn } from "@midday/ui/utils";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import type { ReactElement } from "react";

const fontSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://midday.ai"),
  title: "Midday | The financial OS for your business",
  description:
    "Automate financial tasks, stay organized, and make informed decisions effortlessly.",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
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
      <body className={cn(fontSans.variable, "whitespace-pre-line")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
