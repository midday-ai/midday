"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormContext } from "react-hook-form";

/**
 * Hook for updating invoice templates with automatic templateId injection.
 * DRYs up the repeated pattern of:
 * 1. Getting templateId from form context
 * 2. Creating the upsert mutation
 * 3. Invalidating the templates list on success
 *
 * @example
 * const { updateTemplate, isPending } = useTemplateUpdate();
 * updateTemplate({ logoUrl: "https://..." });
 */
export function useTemplateUpdate() {
  const { watch } = useFormContext();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const templateId = watch("template.id") as string | undefined;

  const mutation = useMutation(
    trpc.invoiceTemplate.upsert.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoiceTemplate.list.queryKey(),
        });
      },
    }),
  );

  const updateTemplate = (
    data: Omit<Parameters<typeof mutation.mutate>[0], "id">,
  ) => {
    mutation.mutate({
      id: templateId,
      ...data,
    });
  };

  return {
    updateTemplate,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    templateId,
  };
}
