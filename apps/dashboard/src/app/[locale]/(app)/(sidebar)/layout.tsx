// import { AI } from "@/actions/ai/chat";
import { ExportStatus } from "@/components/export-status";
import { Header } from "@/components/header";
import { GlobalSheets } from "@/components/sheets/global-sheets";
import { Sidebar } from "@/components/sidebar";
// import { TrialEnded } from "@/components/trial-ended.server";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { getTeamId } from "@/utils/team";
import { setupAnalytics } from "@midday/events/server";
import { getCountryCode, getCurrency } from "@midday/location";
// import { getSession } from "@midday/supabase/cached-queries";
// import { nanoid } from "nanoid";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currencyPromise = getCurrency();
  const countryCodePromise = getCountryCode();
  const team = await getTeamId();

  prefetch(trpc.user.me.queryOptions());

  if (!team) {
    redirect("/teams");
  }

  // const user = await getSession();

  // if (user.data.session) {
  //   await setupAnalytics({ userId: user.data.session.user.id });
  // }

  return (
    <HydrateClient>
      <div className="relative">
        {/* This is used to make the header draggable on macOS */}
        <div className="hidden todesktop:block todesktop:[-webkit-app-region:drag] fixed top-0 w-full h-4 pointer-events-none" />

        {/* <AI
          initialAIState={{
            user: user.data.session?.user ?? null,
            messages: [],
            chatId: nanoid(),
          }}
        > */}
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

        {/* <Suspense>
            <TrialEnded
              createdAt={user.team?.created_at}
              plan={user.team?.plan}
              teamId={user.team.id}
            />
          </Suspense> */}
        {/* </AI> */}
      </div>
    </HydrateClient>
  );
}
