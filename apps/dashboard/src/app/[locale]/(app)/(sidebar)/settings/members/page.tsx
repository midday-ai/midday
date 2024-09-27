import { TeamMembers } from "@/components/team-members";
import config from "@/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Members | ${config.company}`,
};

export default async function Members() {
  return <TeamMembers />;
}
