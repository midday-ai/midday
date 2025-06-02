"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { TeamInvite } from "./team-invite";

export function TeamInvites() {
  const trpc = useTRPC();
  const { data: invites } = useSuspenseQuery(
    trpc.team.invitesByEmail.queryOptions(),
  );

  return (
    <div className="mt-4">
      <span className="text-sm font-mono text-[#878787] mb-4">Invitations</span>

      <div className="mt-6">
        {invites.map((invite) => (
          <TeamInvite key={invite.id} invite={invite} />
        ))}
      </div>
    </div>
  );
}
