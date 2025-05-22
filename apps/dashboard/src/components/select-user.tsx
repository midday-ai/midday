"use client";

import { useTRPC } from "@/trpc/client";
import { Spinner } from "@midday/ui/spinner";
import { useQuery } from "@tanstack/react-query";
import { AssignedUser } from "./assigned-user";

type User = {
  id: string;
  avatarUrl?: string | null;
  fullName: string | null;
};

type Props = {
  onSelect: (selected: User) => void;
};

export function SelectUser({ onSelect }: Props) {
  const trpc = useTRPC();
  const { data: users, isLoading } = useQuery(trpc.team.members.queryOptions());

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return users?.map(({ user }) => {
    return (
      <button
        type="button"
        key={user?.id}
        className="flex items-center text-sm cursor-default"
        onClick={() => {
          if (user) {
            onSelect(user);
          }
        }}
      >
        <AssignedUser avatarUrl={user?.avatarUrl} fullName={user?.fullName} />
      </button>
    );
  });
}
