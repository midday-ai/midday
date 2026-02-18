"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function useUserQuery() {
  const trpc = useTRPC();
  // useQuery instead of useSuspenseQuery so components outside a Suspense
  // boundary don't blank the page during hydration. Data is always
  // pre-fetched by the (sidebar) layout which awaits user.me.
  const result = useQuery({
    ...trpc.user.me.queryOptions(),
    refetchInterval: 6 * 60 * 60 * 1000,
  });
  return result as typeof result & { data: NonNullable<typeof result.data> };
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
        queryClient.setQueryData(trpc.user.me.queryKey(), (old: any) => ({
          ...old,
          ...newData,
        }));

        return { previousData };
      },
      onError: (_, __, context) => {
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
