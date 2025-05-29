import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";

interface ProjectMembersProps {
  members: RouterOutputs["trackerProjects"]["get"]["data"][number]["users"];
}

export function ProjectMembers({ members }: ProjectMembersProps) {
  return (
    <div className="flex space-x-2">
      {members?.map((member) => (
        <div key={member.id} className="relative">
          <Avatar className="rounded-full w-5 h-5">
            <AvatarImageNext
              src={member?.avatarUrl ?? ""}
              alt={member?.fullName ?? ""}
              width={20}
              height={20}
            />
            <AvatarFallback>
              <span className="text-xs">
                {member?.fullName?.charAt(0)?.toUpperCase()}
              </span>
            </AvatarFallback>
          </Avatar>
        </div>
      ))}
    </div>
  );
}
