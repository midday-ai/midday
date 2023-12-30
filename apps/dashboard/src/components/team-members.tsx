import { MembersTable } from "@/components/tables/members/table";
import { getTeamMembers } from "@midday/supabase/cached-queries";
import { Button } from "@midday/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";

export async function TeamMembers() {
  const members = await getTeamMembers();

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
        <MembersTable data={members} />
      </TabsContent>

      <TabsContent value="pending"></TabsContent>
    </Tabs>
  );
}
