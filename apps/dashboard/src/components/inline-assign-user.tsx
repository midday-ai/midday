"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AssignedUser } from "@/components/assigned-user";
import { useTransactionTableContextOptional } from "@/components/tables/transactions/transaction-table-context";
import { useTRPC } from "@/trpc/client";

type User = {
  id: string;
  avatarUrl?: string | null;
  fullName: string | null;
};

type Props = {
  selectedId?: string;
  onSelect: (user: User) => void;
};

export function InlineAssignUser({ selectedId, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();

  // Use shared context when available (inside transaction table), fallback to direct query
  const tableContext = useTransactionTableContextOptional();
  const { data: fallbackUsers } = useQuery({
    ...trpc.team.members.queryOptions(),
    // Skip query if we have context data (already fetched by provider)
    enabled: !tableContext,
  });

  const users = tableContext?.teamMembers ?? fallbackUsers;
  const selectedUser = users?.find(({ user }) => user?.id === selectedId)?.user;

  const handleSelect = (user: User) => {
    onSelect(user);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full text-left hover:opacity-70 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {selectedUser ? (
            <AssignedUser
              avatarUrl={selectedUser.avatarUrl}
              fullName={selectedUser.fullName}
            />
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-2 w-[200px]"
        align="start"
        side="bottom"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="flex flex-col gap-1">
          {users?.map(({ user }) => {
            if (!user) return null;

            return (
              <button
                key={user.id}
                type="button"
                className="flex items-center text-sm p-2 hover:bg-accent rounded-md transition-colors text-left w-full"
                onClick={() => {
                  handleSelect({
                    id: user.id,
                    avatarUrl: user.avatarUrl ?? null,
                    fullName: user.fullName ?? null,
                  });
                }}
              >
                <AssignedUser
                  avatarUrl={user.avatarUrl}
                  fullName={user.fullName}
                />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
