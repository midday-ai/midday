import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ExportStatus } from "@/components/export-status";
import { GlobalTimerProvider } from "@/components/global-timer-provider";
import { Header } from "@/components/header";
import { GlobalSheetsProvider } from "@/components/sheets/global-sheets-provider";
import { Sidebar } from "@/components/sidebar";
import { TimezoneDetector } from "@/components/timezone-detector";
import { TrialGuard } from "@/components/trial-guard";
import {
  batchPrefetch,
  getQueryClient,
  HydrateClient,
  trpc,
} from "@/trpc/server";

async function AuthenticatedContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();
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
    <TrialGuard
      plan={user.team?.plan}
      createdAt={user.team?.createdAt}
      user={{ fullName: user.fullName }}
    >
      <div className="px-4 md:px-8">{children}</div>
    </TrialGuard>
  );
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  batchPrefetch([
    trpc.user.me.queryOptions(),
    trpc.team.current.queryOptions(),
    trpc.team.list.queryOptions(),
    trpc.invoice.defaultSettings.queryOptions(),
    trpc.search.global.queryOptions({ searchTerm: "" }),
  ]);

  return (
    <HydrateClient>
      <div className="relative">
        <Sidebar />

        <div className="md:ml-[70px] pb-4">
          <Header />
          <Suspense>
            <AuthenticatedContent>{children}</AuthenticatedContent>
          </Suspense>
        </div>

        <ExportStatus />
        <GlobalSheetsProvider />
        <GlobalTimerProvider />
        <TimezoneDetector />
      </div>
    </HydrateClient>
  );
}
