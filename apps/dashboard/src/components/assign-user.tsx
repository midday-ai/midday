import { useTRPC } from "@/trpc/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AssignedUser } from "./assigned-user";

type User = {
  id: string;
  avatar_url?: string | null;
  full_name: string | null;
};

type Props = {
  selectedId?: string;
  onSelect: (user?: User) => void;
};

export function AssignUser({ selectedId, onSelect }: Props) {
  const [value, setValue] = useState<string>();
  const trpc = useTRPC();

  const { data: users } = useQuery(trpc.team.members.queryOptions());

  useEffect(() => {
    setValue(selectedId);
  }, [selectedId]);

  return (
    <Select
      value={value}
      onValueChange={(id) =>
        onSelect(users?.find(({ user }) => user?.id === id)?.user)
      }
    >
      <SelectTrigger
        id="assign"
        className="line-clamp-1 truncate"
        onKeyDown={(evt) => evt.preventDefault()}
      >
        <SelectValue placeholder="Select" />
      </SelectTrigger>

      <SelectContent className="overflow-y-auto max-h-[200px]">
        {users?.map(({ user }) => {
          return (
            <SelectItem key={user?.id} value={user?.id}>
              <AssignedUser
                fullName={user?.full_name}
                avatarUrl={user?.avatar_url}
              />
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
