// import { AI } from "@/actions/ai/chat";
import { AI } from "@/actions/ai/chat";
import { ExportStatus } from "@/components/export-status";
import { Header } from "@/components/header";
import { GlobalSheets } from "@/components/sheets/global-sheets";
import { Sidebar } from "@/components/sidebar";
import { HydrateClient, getQueryClient, trpc } from "@/trpc/server";
import { getCountryCode, getCurrency } from "@midday/location";
import { nanoid } from "nanoid";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();
  const currencyPromise = getCurrency();
  const countryCodePromise = getCountryCode();

  // NOTE: Right now we want to fetch the user and hydrate the client
  // Next steps would be to prefetch and suspense
  const user = await queryClient.fetchQuery(trpc.user.me.queryOptions());

  if (!user) {
    redirect("/teams");
  }

  return (
    <HydrateClient>
      <AI
        initialAIState={{
          messages: [],
          chatId: nanoid(),
          user,
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
