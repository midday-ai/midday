import { TeamsTable } from "@/components/tables/teams";
import { TeamsSkeleton } from "@/components/tables/teams/table";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Teams | Solomon AI",
};

export default function Teams() {
  return (
    <Suspense fallback={<TeamsSkeleton />}>
      <TeamsTable />
    </Suspense>
  );
}
