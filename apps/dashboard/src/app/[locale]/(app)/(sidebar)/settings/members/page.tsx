import { TeamMembers } from "@/components/team-members";
import { prefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Members | Midday",
};

export default function Members() {
  prefetch(trpc.team.members.queryOptions());
  prefetch(trpc.team.teamInvites.queryOptions());

  return <TeamMembers />;
}
