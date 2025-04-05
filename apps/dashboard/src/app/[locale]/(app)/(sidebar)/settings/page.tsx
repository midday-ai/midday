import { DeleteTeam } from "@/components/delete-team";
import { TeamAvatar } from "@/components/team-avatar";
import { TeamName } from "@/components/team-name";
import { prefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team Settings | Midday",
};

export default async function Account() {
  prefetch(trpc.team.current.queryOptions());

  return (
    <div className="space-y-12">
      <TeamAvatar />
      <TeamName />
      <DeleteTeam />
    </div>
  );
}
