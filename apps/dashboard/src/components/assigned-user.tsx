import { Avatar, AvatarImage } from "@absplatform/ui/avatar";

type Props = {
  avatarUrl?: string | null;
  fullName?: string | null;
};

export function AssignedUser({ avatarUrl, fullName }: Props) {
  return (
    <div className="flex space-x-2 items-center">
      {avatarUrl && (
        <Avatar className="h-5 w-5">
          <AvatarImage src={avatarUrl} alt={fullName ?? ""} />
        </Avatar>
      )}
      <span className="truncate">{fullName?.split(" ").at(0)}</span>
    </div>
  );
}
