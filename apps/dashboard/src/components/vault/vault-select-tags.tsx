import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import MultipleSelector from "@midday/ui/multiple-selector";
import type { Option as MultipleSelectorOption } from "@midday/ui/multiple-selector";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";

type Option = MultipleSelectorOption & {
  id: string;
};

type Props = {
  tags: Option[];
  onSelect?: (tag: Option) => void;
  onRemove?: (tag: Option) => void;
  onChange?: (tags: Option[]) => void;
};

export function VaultSelectTags({ tags, onSelect, onRemove, onChange }: Props) {
  const [selected, setSelected] = useState<Option[]>(tags ?? []);

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data } = useQuery(trpc.documentTags.get.queryOptions());

  const createTagMutation = useMutation(
    trpc.documentTags.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.documentTags.get.queryKey(),
        });
      },
    }),
  );

  const deleteTagMutation = useMutation(
    trpc.documentTags.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.documentTags.get.queryKey(),
        });
      },
    }),
  );

  const transformedTags = data
    ?.map((tag) => ({
      value: tag.id,
      label: tag.name,
      id: tag.id,
    }))
    .filter((tag) => !selected.some((s) => s.id === tag.id));

  return (
    <div className="w-full">
      <MultipleSelector
        options={transformedTags ?? []}
        value={selected}
        placeholder="Select tags"
        creatable
        renderOption={(option) => {
          return (
            <div className="flex w-full items-center justify-between">
              <span>{option.label}</span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  deleteTagMutation.mutate({
                    id: option.id as string,
                  });
                }}
                className="text-gray-500"
              >
                <Icons.Delete className="h-4 w-4" />
              </button>
            </div>
          );
        }}
        emptyIndicator={<p className="text-sm">No results found.</p>}
        onCreate={(option) => {
          createTagMutation.mutate(
            { name: option.value },
            {
              onSuccess: (data) => {
                if (data) {
                  const newTag = {
                    id: data.id,
                    label: data.name,
                    value: data.name,
                  };

                  setSelected([...selected, newTag]);
                  onSelect?.(newTag);
                }
              },
            },
          );
        }}
        onChange={(options) => {
          const typedOptions = options.map((opt) => ({
            ...opt,
            id: opt.value,
          }));
          setSelected(typedOptions);
          onChange?.(typedOptions);

          const newTag = typedOptions.find(
            (tag) => !selected.find((opt) => opt.value === tag.value),
          );

          if (newTag) {
            onSelect?.(newTag);
            return;
          }

          if (typedOptions.length < selected.length) {
            const removedTag = selected.find(
              (tag) => !typedOptions.find((opt) => opt.value === tag.value),
            );

            if (removedTag) {
              onRemove?.(removedTag);
              setSelected(typedOptions);
            }
          }
        }}
      />
    </div>
  );
}
