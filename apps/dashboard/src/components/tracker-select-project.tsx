"use client";

import { createProjectAction } from "@/actions/project/create-project-action";
import { createClient } from "@midday/supabase/client";
import { getTrackerProjectsQuery } from "@midday/supabase/queries";
import { Combobox } from "@midday/ui/combobox";
import { useToast } from "@midday/ui/use-toast";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";

type Props = {
  teamId: string;
  selectedId?: string;
  onSelect: (selected: Option) => void;
  onCreate: (project: { id: string; name: string }) => void;
};

type Option = {
  id: string;
  name: string;
};

export function TrackerSelectProject({
  teamId,
  selectedId,
  onSelect,
  onCreate,
}: Props) {
  const { toast } = useToast();
  const supabase = createClient();
  const [data, setData] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [value, setValue] = useState<Option | undefined>();

  useEffect(() => {
    const foundProject = data?.find((project) => project?.id === selectedId);

    if (foundProject) {
      setValue({ id: foundProject.id, name: foundProject.name });
    }
  }, [selectedId]);

  const handleSelect = (selected: Option) => {
    setValue(selected);
    onSelect(selected);
  };

  const createProject = useAction(createProjectAction, {
    onSuccess: ({ data: project }) => {
      onCreate?.(project);
      handleSelect(project);
    },
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    },
  });

  const fetchProjects = async () => {
    setLoading(true);

    const { data: projectsData } = await getTrackerProjectsQuery(supabase, {
      teamId,
      sort: ["status", "asc"],
    });

    setLoading(false);
    setData(projectsData);

    const foundProject = projectsData.find(
      (project) => project?.id === selectedId,
    );

    if (foundProject) {
      setValue({
        id: foundProject.id,
        name: foundProject.customer?.name
          ? `${foundProject.name} · ${foundProject.customer.name}`
          : foundProject.name,
      });
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <Combobox
      key={value?.id}
      placeholder="Search or create project"
      classNameList="-top-[4px] border-t-0 rounded-none rounded-b-md"
      className="w-full bg-transparent px-12 border py-3"
      onSelect={handleSelect}
      options={data}
      value={value}
      isLoading={isLoading}
      onCreate={(name) => createProject.execute({ name })}
    />
  );
}
