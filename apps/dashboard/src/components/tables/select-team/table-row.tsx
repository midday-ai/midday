"use client";

import { useTRPC } from "@/trpc/client";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { SubmitButton } from "@midday/ui/submit-button";
import { TableRow as BaseTableRow, TableCell } from "@midday/ui/table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
type Props = {
  row: RouterOutputs["team"]["list"][number];
};

export function TableRow({ row }: Props) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const trpc = useTRPC();
  const router = useRouter();

  const changeTeamMutation = useMutation(
    trpc.user.update.mutationOptions({
      onMutate: () => {
        setIsLoading(true);
      },
      onSuccess: () => {
        queryClient.invalidateQueries();
        router.push("/");
      },
      onError: () => {
        setIsLoading(false);
      },
    }),
  );

  return (
    <BaseTableRow key={row.id} className="hover:bg-transparent">
      <TableCell className="border-r-[0px] py-4">
        <div className="flex items-center space-x-4">
          <Avatar className="rounded-full w-8 h-8">
            {row.team?.logoUrl && (
              <AvatarImageNext
                src={row.team.logoUrl}
                alt={row.team?.name ?? ""}
                width={32}
                height={32}
              />
            )}
            <AvatarFallback>
              <span className="text-xs">
                {row?.team?.name?.charAt(0)?.toUpperCase()}
              </span>
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm">{row?.team?.name}</span>
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
                changeTeamMutation.mutate({
                  teamId: row.team?.id!,
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
