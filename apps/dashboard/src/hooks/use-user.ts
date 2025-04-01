"use client";

import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

export function useUserQuery() {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.user.me.queryOptions());
}

export function useUserMutation() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.user.update.mutationOptions({
      onMutate: async (newData) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({
          queryKey: trpc.user.me.queryKey(),
        });

        // Get current data
        const previousData = queryClient.getQueryData(trpc.user.me.queryKey());

        // Optimistically update
        queryClient.setQueryData(trpc.user.me.queryKey(), (old) => ({
          ...old,
          ...newData,
        }));

        return { previousData };
      },
      onError: (err, newData, context) => {
        // Rollback on error
        queryClient.setQueryData(
          trpc.user.me.queryKey(),
          context?.previousData,
        );
      },
      onSettled: () => {
        // Refetch after error or success
        queryClient.invalidateQueries({
          queryKey: trpc.user.me.queryKey(),
        });
      },
    }),
  );
}
