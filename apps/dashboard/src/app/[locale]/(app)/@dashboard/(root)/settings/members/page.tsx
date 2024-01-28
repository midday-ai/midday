import { TeamMembers } from "@/components/team-members";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Members | Midday",
};

export default async function Members() {
  return (
    <div className="space-y-12">
      <TeamMembers />
    </div>
  );
}
