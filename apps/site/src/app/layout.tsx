import "@/styles/globals.css";
import type { ReactElement } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Switch } from "./switch";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Midday",
  description: "Simple monorepo with shared backend for web & mobile apps",
};

export default function Layout({ children }: { children: ReactElement }) {
  return (
    <html lang="en">
      <body className={["font-sans", fontSans.variable].join(" ")}>
        {children}
        <footer className="mx-auto mt-10 w-full max-w-xl">
          <Switch />
        </footer>
      </body>
    </html>
  );
}
