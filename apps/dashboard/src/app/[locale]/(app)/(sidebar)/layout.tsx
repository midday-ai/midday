import { redirect } from "next/navigation";
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

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();

  // NOTE: These are used in the global sheets
  batchPrefetch([
    trpc.team.current.queryOptions(),
    trpc.invoice.defaultSettings.queryOptions(),
    trpc.search.global.queryOptions({ searchTerm: "" }),
  ]);

  // Fetch the user – .catch → redirect so a transient API failure
  // (timeout, 5xx, expired session, etc.) doesn't crash the entire
  // layout and blank the page.
  const user = await queryClient
    .fetchQuery(trpc.user.me.queryOptions())
    .catch(() => redirect("/login"));

  if (!user) {
    redirect("/login");
  }

  if (!user.fullName || !user.teamId) {
    redirect("/onboarding");
  }

  return (
    <HydrateClient>
      <div className="relative">
        <Sidebar />

        <div className="md:ml-[70px] pb-4">
          <Header />
          <TrialGuard
            plan={user.team?.plan}
            createdAt={user.team?.createdAt}
            user={{ fullName: user.fullName }}
          >
            <div className="px-4 md:px-8">{children}</div>
          </TrialGuard>
        </div>

        <ExportStatus />
        <GlobalSheetsProvider />
        <GlobalTimerProvider />
        <TimezoneDetector />
      </div>
    </HydrateClient>
  );
}
