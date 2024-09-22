"use client";

import { createProjectAction } from "@/actions/project/create-project-action";
import { createClient } from "@midday/supabase/client";
import { getTrackerProjectsQuery } from "@midday/supabase/queries";
import { Combobox } from "@midday/ui/combobox";
import { useToast } from "@midday/ui/use-toast";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";

type Props = {
  teamId: string;
  selectedId?: string;
};

export function TrackerSelectProject({ teamId, selectedId }: Props) {
  const { toast } = useToast();
  const supabase = createClient();
  const [value, setValue] = useState(selectedId);
  const [data, setData] = useState([]);
  const [isLoading, setLoading] = useState(false);

  const action = useAction(createProjectAction, {
    onSuccess: ({ data: project }) => {
      // setParams({ projectId: project?.id || null });
    },
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    },
  });

  const onChangeValue = async (query: string) => {
    setValue(query);
    setLoading(true);

    const { data: projectsData } = await getTrackerProjectsQuery(supabase, {
      teamId,
      search: {
        query: value,
        fuzzy: true,
      },
    });

    setLoading(false);
    setData(projectsData);
  };

  const onSelect = (project) => {
    // setParams({ projectId: project.id });
  };

  return (
    <Combobox
      placeholder="Search or create project"
      classNameList="-top-[4px] border-t-0 rounded-none rounded-b-md"
      className="w-full bg-transparent px-12 border py-3"
      value={value}
      onValueChange={onChangeValue}
      onSelect={onSelect}
      options={data}
      isLoading={isLoading}
      onCreate={(name) => action.execute({ name })}
    />
  );
}
