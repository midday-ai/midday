import "@/styles/globals.css";
import { cn } from "@midday/ui";

import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactElement } from "react";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Midday | Smart pre-accounting",
  description:
    "Automate financial tasks, stay organized, and make informed decisions effortlessly.",
};

export default function Layout({ children }: { children: ReactElement }) {
  return (
    <html lang="en">
      <body
        className={cn(
          ["font-sans", fontSans.variable].join(" "),
          "bg-background"
        )}
      >
        {children}
      </body>
    </html>
  );
}
