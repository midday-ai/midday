"use client";

import { Combobox } from "@midday/ui/combobox";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLatestProjectId } from "@/hooks/use-latest-project-id";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";

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
  const { data: user } = useUserQuery();
  const [value, setValue] = useState<Option | undefined>();
  const [isOpen, setIsOpen] = useState(false);
  const { setLatestProjectId } = useLatestProjectId(user?.teamId);

  const { data, isLoading, refetch } = useQuery(
    trpc.trackerProjects.get.queryOptions({
      pageSize: 100,
    }),
  );

  const upsertTrackerProjectMutation = useMutation(
    trpc.trackerProjects.upsert.mutationOptions({
      onSuccess: (result) => {
        if (result?.id && result?.name) {
          const project = { id: result.id, name: result.name };
          onCreate(project);
          handleSelect(project);
          setLatestProjectId(result.id);
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
      setIsOpen(false); // Close dropdown after selection
    }
  };

  const handleClear = () => {
    setLatestProjectId(null);
    setValue(undefined);
  };

  const handleValueChange = (inputValue: string) => {
    // If input is cleared, remove the selection but keep dropdown open
    if (!inputValue && value) {
      handleClear();
      setIsOpen(true);
    }
  };

  return (
    <Combobox
      key={value?.id}
      placeholder="Search or create project"
      classNameList="top-full mt-1 max-h-[162px] overflow-y-auto"
      className="w-full bg-transparent px-12 border py-3"
      onSelect={handleSelect}
      onValueChange={handleValueChange}
      options={options}
      value={value}
      isLoading={isLoading}
      open={isOpen}
      onOpenChange={setIsOpen}
      onFocus={() => !value && setIsOpen(true)}
      onCreate={(name) => {
        if (name) {
          upsertTrackerProjectMutation.mutate({ name });
        }
      }}
    />
  );
}
