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
 * 4. Updating form with new template ID when a template is created
 *
 * @example
 * const { updateTemplate, isPending } = useTemplateUpdate();
 * updateTemplate({ logoUrl: "https://..." });
 */
export function useTemplateUpdate() {
  const { watch, setValue } = useFormContext();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const templateId = watch("template.id") as string | undefined;

  const mutation = useMutation(
    trpc.invoiceTemplate.upsert.mutationOptions({
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoiceTemplate.list.queryKey(),
        });

        // If a new template was created (id was undefined in request but response has an ID),
        // update the form to track the newly created template. This ensures that when the
        // invoice draft is saved via transformFormValuesToDraft, the templateId is correctly
        // extracted from template.id instead of being null.
        if (data?.id && !variables.id) {
          setValue("template.id", data.id);
          setValue("template.name", data.name);
          setValue("template.isDefault", data.isDefault);
        }
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
