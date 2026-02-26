import { ExportStatus } from "@/components/export-status";
import { Header } from "@/components/header";
import { GlobalSheetsProvider } from "@/components/sheets/global-sheets-provider";
import { Sidebar } from "@/components/sidebar";
import { TimezoneDetector } from "@/components/timezone-detector";
import { TrialGuard } from "@/components/trial-guard";
import {
  HydrateClient,
  batchPrefetch,
  getCurrentUserOrNull,
  trpc,
} from "@/trpc/server";
import { FeedbackWidget } from "@midday/ui/feedback-widget";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserOrNull();

  if (!user) {
    redirect("/api/auth/logout");
  }

  // NOTE: These are used in the global sheets
  batchPrefetch([
    trpc.team.current.queryOptions(),
    trpc.invoice.defaultSettings.queryOptions(),
    trpc.search.global.queryOptions({ searchTerm: "" }),
  ]);

  if (!user.fullName) {
    redirect("/setup");
  }

  if (!user.teamId) {
    redirect("/teams");
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
        <TimezoneDetector />
        <FeedbackWidget
          source="dashboard"
          userEmail={user.email ?? undefined}
        />
      </div>
    </HydrateClient>
  );
}
