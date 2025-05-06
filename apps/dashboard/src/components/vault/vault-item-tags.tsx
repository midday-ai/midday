"use client";

import { useDocumentFilterParams } from "@/hooks/use-document-filter-params";
import type { RouterOutputs } from "@/trpc/routers/_app";
import { Badge } from "@midday/ui/badge";
import { Skeleton } from "@midday/ui/skeleton";

type Props = {
  tags: RouterOutputs["documents"]["get"]["data"][number]["tags"];
  isLoading: boolean;
};

export function VaultItemTags({ tags, isLoading }: Props) {
  const { setFilter } = useDocumentFilterParams();

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mt-auto">
        {[...Array(3)].map((_, index) => (
          <Skeleton
            key={index.toString()}
            className={`h-6 rounded-full ${
              index % 3 === 0 ? "w-16" : index % 3 === 1 ? "w-20" : "w-24"
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mt-auto">
      {tags?.map((tag) => (
        <button
          key={tag.tag.id}
          type="button"
          onClick={() => {
            setFilter({
              tags: [tag.tag.id],
            });
          }}
        >
          <Badge
            variant="tag-rounded"
            className="whitespace-nowrap shrink-0 text-[10px]"
          >
            {tag.tag.name}
          </Badge>
        </button>
      ))}
    </div>
  );
}
