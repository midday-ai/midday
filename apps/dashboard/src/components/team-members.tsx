import { MembersTable } from "@/components/tables/members/table";
import { PendingInvitesTable } from "@/components/tables/pending-invites/table";
import {
  getTeamInvites,
  getTeamMembers,
  getTeamUser,
} from "@midday/supabase/cached-queries";
import { Button } from "@midday/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";

export async function TeamMembers() {
  // TODO: Move to each list and suspense with fallback
  const { data: teamMembersData } = await getTeamMembers();
  const { data: userData } = await getTeamUser();
  const { data: teamInvitesData } = await getTeamInvites();

  return (
    <Tabs defaultValue="members">
      <TabsList className="bg-transparent border-b-[1px] w-full justify-start rounded-none mb-1 p-0 h-auto pb-4">
        <TabsTrigger value="members" className="p-0 m-0 mr-4">
          Team Members
        </TabsTrigger>
        <TabsTrigger value="pending" className="p-0 m-0">
          Pending Invitations
        </TabsTrigger>
      </TabsList>

      <TabsContent value="members">
        <MembersTable data={teamMembersData} currentUser={userData} />
      </TabsContent>

      <TabsContent value="pending">
        <PendingInvitesTable data={teamInvitesData} currentUser={userData} />
      </TabsContent>
    </Tabs>
  );
}
