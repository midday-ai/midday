import { useTRPC } from "@/trpc/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import MultipleSelector from "@midday/ui/multiple-selector";
import { SubmitButton } from "@midday/ui/submit-button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";

type Option = {
  value: string;
  label: string;
  id: string;
};

type Props = {
  tags?: Option[];
  onSelect?: (tag: Option) => void;
  onRemove?: (tag: Option) => void;
  onChange?: (tags: Option[]) => void;
  onCreate?: (tag: Option) => void;
};

export function SelectTags({
  tags,
  onSelect,
  onRemove,
  onChange,
  onCreate,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Option[]>(tags ?? []);
  const [editingTag, setEditingTag] = useState<Option | null>(null);

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data } = useQuery(trpc.tags.get.queryOptions());

  const updateTagMutation = useMutation(
    trpc.tags.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.tags.get.queryKey(),
        });
      },
    }),
  );

  const deleteTagMutation = useMutation(
    trpc.tags.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.tags.get.queryKey(),
        });
      },
    }),
  );

  const createTagMutation = useMutation(
    trpc.tags.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.tags.get.queryKey() });
      },
    }),
  );

  const transformedTags = data?.map((tag) => ({
    value: tag.id,
    label: tag.name,
    id: tag.id,
  }));

  const handleDelete = () => {
    if (editingTag) {
      deleteTagMutation.mutate({ id: editingTag.id });

      setSelected(selected.filter((tag) => tag.id !== editingTag.id));
      setIsOpen(false);
    }
  };

  const handleUpdate = () => {
    if (editingTag) {
      updateTagMutation.mutate({
        id: editingTag.id,
        name: editingTag.label,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="w-full">
        <MultipleSelector
          options={transformedTags ?? []}
          value={selected}
          placeholder="Select tags"
          creatable
          emptyIndicator={<p className="text-sm">No results found.</p>}
          renderOption={(option) => (
            <div className="flex items-center justify-between w-full group">
              <span>{option.label}</span>

              <button
                type="button"
                className="text-xs group-hover:opacity-50 opacity-0"
                onClick={(event) => {
                  event.stopPropagation();
                  setEditingTag(option);
                  setIsOpen(true);
                }}
              >
                Edit
              </button>
            </div>
          )}
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
                    onCreate?.(newTag);
                    onSelect?.(newTag);
                  }
                },
              },
            );
          }}
          onChange={(options) => {
            setSelected(options);
            onChange?.(options);

            const newTag = options.find(
              (tag) => !selected.find((opt) => opt.value === tag.value),
            );

            if (newTag) {
              onSelect?.(newTag);
              return;
            }

            if (options.length < selected.length) {
              const removedTag = selected.find(
                (tag) => !options.find((opt) => opt.value === tag.value),
              ) as Option & { id: string };

              if (removedTag) {
                onRemove?.(removedTag);
                setSelected(options);
              }
            }
          }}
        />
      </div>

      <DialogContent className="max-w-[455px]">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription>
              Make changes to the tag here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 w-full flex flex-col mt-4">
            <Label>Name</Label>
            <Input
              value={editingTag?.label}
              onChange={(event) => {
                if (editingTag) {
                  setEditingTag({
                    id: editingTag.id,
                    label: event.target.value,
                    value: editingTag.value,
                  });
                }
              }}
            />
          </div>

          <DialogFooter className="mt-8 w-full">
            <div className="space-y-2 w-full flex flex-col">
              <SubmitButton
                isSubmitting={updateTagMutation.isPending}
                onClick={handleUpdate}
              >
                Save
              </SubmitButton>

              <SubmitButton
                isSubmitting={deleteTagMutation.isPending}
                variant="outline"
                onClick={handleDelete}
              >
                Delete
              </SubmitButton>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
