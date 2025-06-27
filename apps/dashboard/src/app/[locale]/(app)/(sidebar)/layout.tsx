import { ExportStatus } from "@/components/export-status";
import { Header } from "@/components/header";
import { GlobalSheets } from "@/components/sheets/global-sheets";
import { Sidebar } from "@/components/sidebar";
import {
  HydrateClient,
  batchPrefetch,
  getQueryClient,
  trpc,
} from "@/trpc/server";
import { getCountryCode, getCurrency } from "@midday/location";
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

  // NOTE: These are used in the global sheets
  batchPrefetch([
    trpc.team.current.queryOptions(),
    trpc.invoice.defaultSettings.queryOptions(),
    trpc.search.global.queryOptions({ searchTerm: "" }),
  ]);

  // NOTE: Right now we want to fetch the user and hydrate the client
  // Next steps would be to prefetch and suspense
  const user = await queryClient.fetchQuery(trpc.user.me.queryOptions());

  if (!user) {
    redirect("/login");
  }

  if (!user.fullName) {
    redirect("/setup");
  }

  if (!user.teamId) {
    redirect("/teams");
  }

  return (
    <HydrateClient>
      <div className="overflow-hidden desktop:h-screen">
        <Sidebar />

        <div className="md:ml-[70px] pb-8">
          <Header />
          <div className="px-6">{children}</div>
        </div>

        <ExportStatus />

        <Suspense>
          <GlobalSheets
            currencyPromise={currencyPromise}
            countryCodePromise={countryCodePromise}
          />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
