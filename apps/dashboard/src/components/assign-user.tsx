"use client";

import { updateTransactionAction } from "@/actions/update-transaction-action";
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
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { AssignedUser } from "./assigned-user";

export function AssignUser({ id, selectedId, isLoading }) {
  const action = useAction(updateTransactionAction);
  const [value, setValue] = useState();
  const supabase = createClient();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    setValue(selectedId);
  }, [selectedId]);

  useEffect(() => {
    async function getUsers() {
      const { data: userData } = await getCurrentUserTeamQuery(supabase);
      const { data: membersData } = await getTeamMembersQuery(
        supabase,
        userData?.team_id
      );

      setUsers(membersData);
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
          <Select
            value={value}
            onValueChange={(assigned_id) => {
              action.execute({
                id,
                assigned_id,
              });
            }}
          >
            <SelectTrigger
              id="assign"
              className="line-clamp-1 truncate"
              onKeyDown={(evt) => evt.preventDefault()}
            >
              <SelectValue placeholder="Select" />
            </SelectTrigger>

            <SelectContent className="overflow-y-auto max-h-[200px]">
              {users?.map(({ user }) => (
                <SelectItem key={user?.id} value={user?.id}>
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
