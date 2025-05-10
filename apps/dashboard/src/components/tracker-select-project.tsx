"use client";

import { useLatestProjectId } from "@/hooks/use-latest-project-id";
import { useTRPC } from "@/trpc/client";
import { Combobox } from "@midday/ui/combobox";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

type Props = {
  selectedId?: string;
  onSelect: (selected: Option) => void;
  onCreate: (project: { id: string; name: string }) => void;
};

type Option = {
  id: string;
  name: string;
};

export function TrackerSelectProject({
  selectedId,
  onSelect,
  onCreate,
}: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [value, setValue] = useState<Option | undefined>();
  const { setLatestProjectId } = useLatestProjectId();

  const { data, isLoading, refetch } = useQuery(
    trpc.trackerProjects.get.queryOptions({
      pageSize: 100,
    }),
  );

  const upsertTrackerProjectMutation = useMutation(
    trpc.trackerProjects.upsert.mutationOptions({
      onSuccess: (result) => {
        if (result) {
          onCreate(result);
          handleSelect(result);
          setLatestProjectId(result?.id ?? null);
          refetch();

          queryClient.invalidateQueries({
            queryKey: trpc.trackerProjects.get.infiniteQueryKey(),
          });

          // Invalidate global search
          queryClient.invalidateQueries({
            queryKey: trpc.search.global.queryKey(),
          });
        }
      },
      onError: () => {
        toast({
          duration: 3500,
          variant: "error",
          title: "Something went wrong please try again.",
        });
      },
    }),
  );

  const options =
    data?.data.map((project) => ({
      id: project.id,
      name: project.customer?.name
        ? `${project.name} · ${project.customer.name}`
        : project.name,
    })) ?? [];

  useEffect(() => {
    const foundProject = options?.find((project) => project?.id === selectedId);

    if (foundProject) {
      setValue({ id: foundProject.id, name: foundProject.name });
    }
  }, [selectedId, data]);

  const handleSelect = (selected?: Option) => {
    if (selected) {
      setLatestProjectId(selected?.id);
      setValue(selected);
      onSelect(selected);
    }
  };

  return (
    <Combobox
      key={value?.id}
      placeholder="Search or create project"
      classNameList="-top-[4px] border-t-0 rounded-none rounded-b-md"
      className="w-full bg-transparent px-12 border py-3"
      onSelect={handleSelect}
      options={options}
      value={value}
      isLoading={isLoading}
      onCreate={(name) => {
        if (name) {
          upsertTrackerProjectMutation.mutate({ name });
        }
      }}
    />
  );
}
