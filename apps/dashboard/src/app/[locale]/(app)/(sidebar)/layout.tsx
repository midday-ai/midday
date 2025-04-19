import { AI } from "@/actions/ai/chat";
import { ExportStatus } from "@/components/export-status";
import { Header } from "@/components/header";
import { GlobalSheets } from "@/components/sheets/global-sheets";
import { Sidebar } from "@/components/sidebar";
import { HydrateClient, getQueryClient, prefetch, trpc } from "@/trpc/server";
import { getCountryCode, getCurrency } from "@midday/location";
import { nanoid } from "nanoid";
import { Suspense } from "react";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currencyPromise = getCurrency();
  const countryCodePromise = getCountryCode();

  prefetch(trpc.user.me.queryOptions());

  return (
    <HydrateClient>
      <AI
        initialAIState={{
          messages: [],
          chatId: nanoid(),
        }}
      >
        <div className="relative">
          {/* This is used to make the header draggable on macOS */}
          <div className="hidden todesktop:block todesktop:[-webkit-app-region:drag] fixed top-0 w-full h-4 pointer-events-none" />

          <Sidebar />

          <div className="mx-4 md:ml-[95px] md:mr-10 pb-8">
            <Header />
            {children}
          </div>

          <ExportStatus />

          <Suspense>
            <GlobalSheets
              currencyPromise={currencyPromise}
              countryCodePromise={countryCodePromise}
            />
          </Suspense>
        </div>
      </AI>
    </HydrateClient>
  );
}
