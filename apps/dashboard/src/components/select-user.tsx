"use client";

import { useUserContext } from "@/store/user/hook";
import { createClient } from "@midday/supabase/client";
import { getTeamMembersQuery } from "@midday/supabase/queries";
import { Spinner } from "@midday/ui/spinner";
import { useEffect, useState } from "react";
import { AssignedUser } from "./assigned-user";

type User = {
  id: string;
  avatar_url?: string | null;
  full_name: string | null;
};

type Props = {
  selectedId?: string;
  onSelect: (selected: User) => void;
};

export function SelectUser({ selectedId, onSelect }: Props) {
  const [value, setValue] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
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
      setIsLoading(false);
    }

    setIsLoading(true);
    getUsers();
  }, [supabase]);

  if (!selectedId && isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return users.map((user) => {
    return (
      <button
        type="button"
        key={user.id}
        className="flex items-center text-sm cursor-default"
        onClick={() => onSelect(user)}
      >
        <AssignedUser avatarUrl={user.avatar_url} fullName={user.full_name} />
      </button>
    );
  });
}
