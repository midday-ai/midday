import { updateTransactionAction } from "@/actions";
import { getSupabaseBrowserClient } from "@midday/supabase/browser-client";
import { getTeamMembers } from "@midday/supabase/queries";
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

export function AssignUser({ id, selectedId, isLoading }) {
  const supabase = getSupabaseBrowserClient();
  const [users, setUsers] = useState([]);

  const handleOnValueChange = (value: string) => {
    startTransition(() => {
      updateTransactionAction(id, {
        assigned_id: value,
      });
    });
  };

  useEffect(() => {
    async function getUsers() {
      const data = await getTeamMembers(supabase);
      setUsers(data);
    }

    getUsers();
  }, [supabase]);

  return (
    <>
      <Label htmlFor="assign">Assign</Label>
      {isLoading ? (
        <Skeleton className="h-[36px] rounded-md" />
      ) : (
        <Select defaultValue={selectedId} onValueChange={handleOnValueChange}>
          <SelectTrigger id="assign" className="line-clamp-1 truncate">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {users.map(({ user }) => (
              <SelectItem key={user.id} value={user.id}>
                {user.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </>
  );
}
