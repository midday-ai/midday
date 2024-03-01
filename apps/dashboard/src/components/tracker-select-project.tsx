"use client";

import { createProjectAction } from "@/actions/project/create-project-action";
import { createClient } from "@midday/supabase/client";
import { getTrackerProjectsQuery } from "@midday/supabase/queries";
import { Combobox } from "@midday/ui/combobox";
import { Icons } from "@midday/ui/icons";
import { useToast } from "@midday/ui/use-toast";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";

export function TrackerSelectProject({ setParams, teamId }) {
  const { toast } = useToast();
  const supabase = createClient();
  const [value, setValue] = useState("");
  const [data, setData] = useState([]);

  const action = useAction(createProjectAction, {
    onSuccess: (project) => {
      setParams({ projectId: project.id });
    },
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });
    },
  });

  async function fetchData() {
    const { data: projectsData } = await getTrackerProjectsQuery(supabase, {
      teamId,
      to: 100,
    });

    setData(projectsData);
  }

  useEffect(() => {
    if (!data.length) {
      fetchData();
    }
  }, [data]);

  const onSelect = (project) => {
    setParams({ projectId: project.id });
  };

  return (
    <div className="relative">
      <Icons.Search className="absolute pointer-events-none left-3 top-[12px] z-[51]" />

      <Combobox
        placeholder="Search or create project"
        className="w-full relative pl-9"
        classNameList="top-[36px] border-t-0 rounded-none rounded-b-md"
        value={value}
        onValueChange={setValue}
        onSelect={onSelect}
        options={data}
        hidden={false}
        onCreate={(name) => action.execute({ name })}
      />
    </div>
  );
}
