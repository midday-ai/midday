"use client";

import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

export function Invites() {
  const t = useI18n();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: invites } = useSuspenseQuery(trpc.user.invites.queryOptions());

  const declineInviteMutation = useMutation(
    trpc.team.declineInvite.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.user.invites.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.team.list.queryKey(),
        });
      },
    }),
  );

  const acceptInviteMutation = useMutation(
    trpc.team.acceptInvite.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.user.invites.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.team.list.queryKey(),
        });
      },
    }),
  );

  if (!invites?.length) {
    return null;
  }

  return (
    <div className="border divide-y">
      {invites?.map((invite) => (
        <div key={invite.id} className="px-4 align-middle py-4">
          <div className="flex items-center space-x-4 justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <Avatar className="rounded-full w-8 h-8">
                  <AvatarImageNext
                    src={invite.team?.logo_url ?? ""}
                    alt={invite.team?.name ?? ""}
                    width={32}
                    height={32}
                  />
                  <AvatarFallback>
                    <span className="text-xs">
                      {invite.team?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">
                    {invite.team?.name}
                  </span>
                  <span className="text-sm text-[#606060]">
                    {t(`roles.${invite.role}`)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="flex space-x-3 items-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    declineInviteMutation.mutate({
                      teamId: invite.team?.id ?? "",
                    });
                  }}
                >
                  Decline
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    acceptInviteMutation.mutate({
                      teamId: invite.team?.id ?? "",
                    });
                  }}
                >
                  Accept
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
