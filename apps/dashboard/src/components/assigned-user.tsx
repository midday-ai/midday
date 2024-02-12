import { Avatar, AvatarImage } from "@midday/ui/avatar";

export function AssignedUser({ user }) {
  return (
    <div className="flex space-x-2 mt-1">
      {user?.avatar_url && (
        <Avatar className="h-5 w-5">
          <AvatarImage src={user.avatar_url} alt={user?.full_name} />
        </Avatar>
      )}
      <span className="truncate">{user?.full_name.split(" ").at(0)}</span>
    </div>
  );
}
