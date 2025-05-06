"use client";

import { changeTeamAction } from "@/actions/change-team-action";
import type { RouterOutputs } from "@/trpc/routers/_app";
import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { SubmitButton } from "@midday/ui/submit-button";
import { TableRow as BaseTableRow, TableCell } from "@midday/ui/table";
import { useQueryClient } from "@tanstack/react-query";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";

type Props = {
  row: RouterOutputs["team"]["list"][number];
};

export function TableRow({ row }: Props) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const changeTeam = useAction(changeTeamAction, {
    onExecute: () => {
      setIsLoading(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
    onError: () => {
      setIsLoading(false);
    },
  });

  return (
    <BaseTableRow key={row.id} className="hover:bg-transparent">
      <TableCell className="border-r-[0px] py-4">
        <div className="flex items-center space-x-4">
          <Avatar className="rounded-full w-8 h-8">
            {row.team?.logo_url && (
              <AvatarImageNext
                src={row.team.logo_url}
                alt={row.team?.name ?? ""}
                width={32}
                height={32}
              />
            )}
            <AvatarFallback>
              <span className="text-xs">
                {row.team.name?.charAt(0)?.toUpperCase()}
              </span>
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm">{row.team.name}</span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex justify-end">
          <div className="flex space-x-3 items-center">
            <SubmitButton
              isSubmitting={isLoading}
              variant="outline"
              onClick={() => {
                changeTeam.execute({
                  teamId: row.team.id,
                  redirectTo: "/",
                });
              }}
            >
              Launch
            </SubmitButton>
          </div>
        </div>
      </TableCell>
    </BaseTableRow>
  );
}
