import { createTagAction } from "@/actions/create-tag-action";
import { useUserContext } from "@/store/user/hook";
import { createClient } from "@midday/supabase/client";
import { getTagsQuery } from "@midday/supabase/queries";
import MultipleSelector, { type Option } from "@midday/ui/multiple-selector";
import { useAction } from "next-safe-action/hooks";
import React, { useEffect, useState } from "react";

type Props = {
  tags?: Option[];
  onSelect?: (tag: Option) => void;
  onRemove?: (tag: Option & { id: string }) => void;
  onChange?: (tags: Option[]) => void;
};

export function SelectTags({ tags, onSelect, onRemove, onChange }: Props) {
  const supabase = createClient();

  const [data, setData] = useState<Option[]>(tags ?? []);
  const [selected, setSelected] = useState<Option[]>(tags ?? []);
  const createTag = useAction(createTagAction, {
    onSuccess: ({ data }) => {
      onSelect(data);
    },
  });

  const { team_id: teamId } = useUserContext((state) => state.data);

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

  return (
    <div className="w-full">
      <MultipleSelector
        options={data}
        value={selected}
        placeholder="Select tags"
        creatable
        emptyIndicator={<p className="text-sm">No results found.</p>}
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
            );

            if (removedTag) {
              onRemove?.(removedTag);
              setSelected(options);
            }
          }
        }}
      />
    </div>
  );
}
