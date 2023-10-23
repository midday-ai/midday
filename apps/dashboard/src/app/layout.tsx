import { ThemeProvider } from "@/components/theme-provider";
import "@/styles/globals.css";
import "@midday/ui/globals.css";
import { Toaster } from "@midday/ui/toaster";
import { cn } from "@midday/ui/utils";
import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import type { ReactElement } from "react";

export const runtime = "edge";
export const preferredRegion = "fra1";

const fontSans = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Midday | The financial OS for your business",
  description:
    "Automate financial tasks, stay organized, and make informed decisions effortlessly.",
};

export default function Layout({ children }: { children: ReactElement }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(fontSans.variable, "bg-background")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          forcedTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
