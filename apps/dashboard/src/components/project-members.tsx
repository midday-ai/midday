import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";

interface Member {
  id: string;
  avatar_url?: string;
  full_name?: string;
}

interface ProjectMembersProps {
  members: Member[];
}

export function ProjectMembers({ members }: ProjectMembersProps) {
  return (
    <div className="flex space-x-2">
      {members?.map((member) => (
        <div key={member.id} className="relative">
          <Avatar className="rounded-full w-5 h-5">
            <AvatarImageNext
              src={member?.avatar_url}
              alt={member?.full_name ?? ""}
              width={20}
              height={20}
            />
            <AvatarFallback>
              <span className="text-xs">
                {member?.full_name?.charAt(0)?.toUpperCase()}
              </span>
            </AvatarFallback>
          </Avatar>
        </div>
      ))}
    </div>
  );
}
