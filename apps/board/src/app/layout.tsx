import type { Metadata } from "next";
import "../styles/globals.css";
import "@midday/ui/globals.css";
import { Sidebar } from "@/components/sidebar";
import { TRPCReactProvider } from "@/lib/trpc-react";
import { HydrateClient } from "@/trpc/server";
import { cn } from "@midday/ui/cn";
import { Hedvig_Letters_Sans, Hedvig_Letters_Serif } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const hedvigSans = Hedvig_Letters_Sans({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-hedvig-sans",
});

const hedvigSerif = Hedvig_Letters_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-hedvig-serif",
});

export const metadata: Metadata = {
  title: "Queue Board",
  description: "Queue administration interface",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          `${hedvigSans.variable} ${hedvigSerif.variable} font-sans`,
          "bg-background text-foreground",
        )}
      >
        <NuqsAdapter>
          <TRPCReactProvider>
            <HydrateClient>
              <div className="relative">
                <Sidebar />
                <div className="md:ml-[70px] pb-4">
                  <div className="px-4 md:px-8">{children}</div>
                </div>
              </div>
            </HydrateClient>
          </TRPCReactProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
