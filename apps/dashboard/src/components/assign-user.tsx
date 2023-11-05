import { updateTransactionAction } from "@/actions";
import { createClient } from "@midday/supabase/client";
import {
  getCurrentUserTeamQuery,
  getTeamMembersQuery,
} from "@midday/supabase/queries";
import { Label } from "@midday/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Skeleton } from "@midday/ui/skeleton";
import { startTransition, useEffect, useState } from "react";
import { AssignedUser } from "./assigned-user";

export function AssignUser({ id, selectedId, isLoading }) {
  const [value, setValue] = useState();
  const supabase = createClient();
  const [users, setUsers] = useState([]);

  const handleOnValueChange = (value: string) => {
    startTransition(() => {
      updateTransactionAction(id, {
        assigned_id: value,
      });
    });
  };

  useEffect(() => {
    setValue(selectedId);
  }, [selectedId]);

  useEffect(() => {
    async function getUsers() {
      const { data: userData } = await getCurrentUserTeamQuery(supabase);
      const data = await getTeamMembersQuery(supabase, userData?.team_id);
      setUsers(data);
    }

    getUsers();
  }, [supabase]);

  return (
    <div className="relative">
      <Label htmlFor="assign">Assign</Label>

      <div className="mt-1">
        {isLoading ? (
          <div className="h-[36px] border rounded-md">
            <Skeleton className="h-[14px] w-[60%] rounded-sm absolute left-3 top-[39px]" />
          </div>
        ) : (
          <Select value={value} onValueChange={handleOnValueChange}>
            <SelectTrigger id="assign" className="line-clamp-1 truncate">
              <SelectValue placeholder="Select" />
            </SelectTrigger>

            <SelectContent>
              {users.map(({ user }) => (
                <SelectItem key={user.id} value={user.id}>
                  <AssignedUser user={user} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
