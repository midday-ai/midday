import { createClient } from "@midday/supabase/client";
import {
  getCurrentUserTeamQuery,
  getTeamMembersQuery,
} from "@midday/supabase/queries";
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

type Props = {
  selectedId: string;
  isLoading: boolean;
  onSelect: (selectedId: string) => void;
};

type User = {
  id: string;
  avatar_url?: string | null;
  full_name: string | null;
};

export function AssignUser({ selectedId, isLoading, onSelect }: Props) {
  const [value, setValue] = useState<string>();
  const supabase = createClient();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    setValue(selectedId);
  }, [selectedId]);

  useEffect(() => {
    async function getUsers() {
      const { data: userData } = await getCurrentUserTeamQuery(supabase);

      if (userData?.team_id) {
        const { data: membersData } = await getTeamMembersQuery(
          supabase,
          userData.team_id
        );

        setUsers(membersData?.map(({ user }) => user));
      }
    }

    getUsers();
  }, [supabase]);

  return (
    <div className="relative">
      {isLoading ? (
        <div className="h-[36px] border rounded-md">
          <Skeleton className="h-[14px] w-[60%] rounded-sm absolute left-3 top-[39px]" />
        </div>
      ) : (
        <Select value={value} onValueChange={onSelect}>
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
                    fullName={user.full_name}
                    avatarUrl={user.avatar_url}
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
