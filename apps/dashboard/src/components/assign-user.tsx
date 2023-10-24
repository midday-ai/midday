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
  const [value, setValue] = useState();
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
    setValue(selectedId);
  }, [selectedId]);

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

      <div className="relative">
        <Select value={value} onValueChange={handleOnValueChange}>
          <SelectTrigger id="assign" className="line-clamp-1 truncate">
            {isLoading && (
              <Skeleton className="h-[14px] w-[60%] rounded-sm absolute left-3 top-2.5 z-10" />
            )}
            <SelectValue placeholder={!isLoading && "Select"} />
          </SelectTrigger>

          <SelectContent>
            {users.map(({ user }) => (
              <SelectItem key={user.id} value={user.id}>
                {user.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
