import { MembersTable } from "@/components/tables/members/table";
import { PendingInvitesTable } from "@/components/tables/pending-invites/table";
import {
  getTeamInvites,
  getTeamMembers,
  getTeamUser,
} from "@midday/supabase/cached-queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";

export async function TeamMembers() {
  // TODO: Move to each list and suspense with fallback
  const teamMembers = await getTeamMembers();
  const user = await getTeamUser();
  const teamInvites = await getTeamInvites();

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
        <MembersTable data={teamMembers?.data} currentUser={user?.data} />
      </TabsContent>

      <TabsContent value="pending">
        <PendingInvitesTable
          data={teamInvites?.data}
          currentUser={user?.data}
        />
      </TabsContent>
    </Tabs>
  );
}
