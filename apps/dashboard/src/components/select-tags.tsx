import { createTagAction } from "@/actions/create-tag-action";
import { deleteTagAction } from "@/actions/delete-tag-action";
import { updateTagAction } from "@/actions/update-tag-action";
import { useUserContext } from "@/store/user/hook";
import { createClient } from "@midday/supabase/client";
import { getTagsQuery } from "@midday/supabase/queries";
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
import MultipleSelector, { type Option } from "@midday/ui/multiple-selector";
import { SubmitButton } from "@midday/ui/submit-button";
import { useAction } from "next-safe-action/hooks";
import React, { useEffect, useState } from "react";

type Props = {
  tags?: Option[];
  onSelect?: (tag: Option) => void;
  onRemove?: (tag: Option & { id: string }) => void;
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
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<Option[]>(tags ?? []);
  const [selected, setSelected] = useState<Option[]>(tags ?? []);
  const [editingTag, setEditingTag] = useState<Option | null>(null);

  const { team_id: teamId } = useUserContext((state) => state.data);

  const deleteTag = useAction(deleteTagAction, {
    onSuccess: () => {
      setIsOpen(false);
      setEditingTag(null);
    },
  });

  const createTag = useAction(createTagAction, {
    onSuccess: ({ data }) => {
      if (data) {
        const newTag: Option = {
          label: data.name,
          value: data.name,
          id: data.id,
        };
        onSelect?.(newTag);
        onCreate?.(newTag);
      }
    },
  });

  const updateTag = useAction(updateTagAction, {
    onSuccess: () => {
      setIsOpen(false);
      setEditingTag(null);
    },
  });

  useEffect(() => {
    async function fetchData() {
      const { data } = await getTagsQuery(supabase, teamId);

      if (data?.length) {
        setData(
          data.map((tag) => ({
            label: tag.name,
            value: tag.name,
            id: tag.id,
          })),
        );
      }
    }

    fetchData();
  }, [teamId]);

  const handleDelete = () => {
    deleteTag.execute({ id: editingTag?.id });
    setSelected(selected.filter((tag) => tag.id !== editingTag?.id));
    setData(data.filter((tag) => tag.id !== editingTag?.id));
  };

  const handleUpdate = () => {
    updateTag.execute({ id: editingTag?.id, name: editingTag?.value });

    setData(
      data.map((tag) =>
        tag.id === editingTag?.id
          ? { ...tag, label: editingTag.value, value: editingTag.value }
          : tag,
      ),
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="w-full">
        <MultipleSelector
          options={data}
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
            createTag.execute({ name: option.value });
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
              value={editingTag?.value}
              onChange={(event) =>
                setEditingTag({ ...editingTag, value: event.target.value })
              }
            />
          </div>

          <DialogFooter className="mt-8 w-full">
            <div className="space-y-2 w-full flex flex-col">
              <SubmitButton
                isSubmitting={updateTag.isExecuting}
                onClick={handleUpdate}
              >
                Save
              </SubmitButton>

              <SubmitButton
                isSubmitting={deleteTag.isExecuting}
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
