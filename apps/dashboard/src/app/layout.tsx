import { StaffToolbar } from "@/components/staff-toolbar";
import { ThemeProvider } from "@/components/theme-provider";
import "@/styles/globals.css";
import "@midday/ui/globals.css";
import { Toaster } from "@midday/ui/toaster";
import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import { type ReactElement, Suspense } from "react";

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

export default function Layout({ children }: { children: ReactElement }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={fontSans.variable}>
        <ThemeProvider attribute="class">
          {children}
          <Toaster />
        </ThemeProvider>

        <Suspense>
          <StaffToolbar />
        </Suspense>
      </body>
    </html>
  );
}
