import { useUserContext } from "@/store/user/hook";
import { createClient } from "@midday/supabase/client";
import { getTeamMembersQuery } from "@midday/supabase/queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Skeleton } from "@midday/ui/skeleton";
import { useEffect, useState } from "react";
import { AssignedUser } from "./assigned-user";

type User = {
  id: string;
  avatar_url?: string | null;
  full_name: string | null;
};

type Props = {
  selectedId?: string;
  isLoading: boolean;
  onSelect: (user?: User) => void;
};

export function AssignUser({ selectedId, isLoading, onSelect }: Props) {
  const [value, setValue] = useState<string>();
  const supabase = createClient();
  const [users, setUsers] = useState<User[]>([]);
  const { team_id: teamId } = useUserContext((state) => state.data);

  useEffect(() => {
    setValue(selectedId);
  }, [selectedId]);

  useEffect(() => {
    async function getUsers() {
      const { data: membersData } = await getTeamMembersQuery(supabase, teamId);

      setUsers(membersData?.map(({ user }) => user));
    }

    getUsers();
  }, [supabase]);

  return (
    <div className="relative">
      {isLoading ? (
        <div className="h-[36px] border">
          <Skeleton className="h-[14px] w-[60%] absolute left-3 top-[39px]" />
        </div>
      ) : (
        <Select
          value={value}
          onValueChange={(id) => onSelect(users.find((user) => user.id === id))}
        >
          <SelectTrigger
            id="assign"
            className="line-clamp-1 truncate"
            onKeyDown={(evt) => evt.preventDefault()}
          >
            <SelectValue placeholder="Select" />
          </SelectTrigger>

          <SelectContent className="overflow-y-auto max-h-[200px]">
            {users?.map((user) => {
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
      )}
    </div>
  );
}
