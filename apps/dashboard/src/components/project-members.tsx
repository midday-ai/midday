import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";

export function ProjectMembers({ members }) {
  return (
    <div className="flex space-x-2">
      {members?.map((member) => (
        <div key={member.id} className="relative">
          {member.working && (
            <div className="w-[6px] h-[6px] rounded-full bg-[#00C969] absolute z-10 -right-[1px] -top-[1px] border border-[1px] border-background" />
          )}

          <Avatar className="rounded-full w-5 h-5">
            <AvatarImage src={member?.avatar_url} />
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
