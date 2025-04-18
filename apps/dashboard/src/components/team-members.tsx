import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { Suspense } from "react";
import { DataTable as MembersTable } from "./tables/members";
import { DataTable as PendingInvitesTable } from "./tables/pending-invites";
import { PendingInvitesSkeleton } from "./tables/pending-invites/skeleton";

export function TeamMembers() {
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
        <Suspense fallback={<PendingInvitesSkeleton />}>
          <MembersTable />
        </Suspense>
      </TabsContent>

      <TabsContent value="pending">
        <Suspense fallback={<PendingInvitesSkeleton />}>
          <PendingInvitesTable />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}
