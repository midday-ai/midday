import { createTagsAction } from "@/actions/create-tags-action";
import { useUserContext } from "@/store/user/hook";
import { createClient } from "@midday/supabase/client";
import { getTransactionTagsQuery } from "@midday/supabase/queries";
import MultipleSelector, { type Option } from "@midday/ui/multiple-selector";
import { useAction } from "next-safe-action/hooks";
import React, { useEffect, useState } from "react";

type Props = {
  tags?: Option[];
};

export function SelectTags({ tags }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<Option[]>(tags ?? []);
  const createTags = useAction(createTagsAction);
  const supabase = createClient();
  const { team_id: teamId } = useUserContext((state) => state.data);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);

      const { data } = await getTransactionTagsQuery(supabase, teamId);

      if (data?.length) {
        setData(
          data.map((tag) => ({
            label: tag.name,
            value: tag.name,
            id: tag.id,
          })),
        );
      }

      setIsLoading(false);
    }

    if (!data?.length) {
      fetchData();
    }
  }, [teamId]);

  return (
    <div className="w-full">
      <MultipleSelector
        // key={isLoading ? "loading" : "loaded"}
        options={data}
        placeholder="Select tags"
        creatable
        emptyIndicator={<p className="text-sm">no results found.</p>}
        onChange={(options) => {
          const newTags = options.filter((option) => option.create);

          console.log(newTags);

          if (newTags.length > 0) {
            createTags.execute(newTags.map((tag) => ({ name: tag.value })));
          }
        }}
      />
    </div>
  );
}
