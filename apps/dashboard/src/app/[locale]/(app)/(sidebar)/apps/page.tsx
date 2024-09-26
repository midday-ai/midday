import { AppsHeader } from "@/components/apps-header";
import { AppsServer } from "@/components/apps.server";
import { getUser } from "@midday/supabase/cached-queries";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Apps | Midday",
};

export default async function Page() {
  const { data } = await getUser();

  return (
    <div className="mt-4">
      <AppsHeader />

      <Suspense fallback={<div>Loading...</div>}>
        <AppsServer user={data} />
      </Suspense>
    </div>
  );
}
