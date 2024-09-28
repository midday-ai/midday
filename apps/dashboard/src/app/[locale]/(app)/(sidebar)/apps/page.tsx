import { AppsHeader } from "@/components/apps-header";
import { AppsServer } from "@/components/apps.server";
import { AppsSkeleton } from "@/components/apps.skeleton";
import { PortalViewWrapper } from "@/components/portal-views/portal-view-wrapper";
import config from "@/config";
import { getUser } from "@midday/supabase/cached-queries";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: `Apps | ${config.company}`,
};

export default async function Page() {
  const { data } = await getUser();

  return (
    <div className="mt-4">
      <PortalViewWrapper
        title={`${config.company} Integration Marketplace`}
        description={`Connect business-critical integrations to ${config.company}`}
        subtitle={``}
        disabled={false}
        className="w-full border-none py-[2%] px-[0.5%]"
      >
        <AppsHeader />

        <Suspense fallback={<AppsSkeleton />}>
          <AppsServer user={data} />
        </Suspense>
      </PortalViewWrapper>

    </div>
  );
}
