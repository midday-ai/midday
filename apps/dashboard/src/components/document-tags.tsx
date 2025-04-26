"use client";

import type { RouterOutputs } from "@/trpc/routers/_app";
import { Badge } from "@midday/ui/badge";
import { useRouter } from "next/navigation";

type Tag = NonNullable<RouterOutputs["documents"]["getByPath"]>["tags"][number];

type Props = {
  tags?: Tag[];
};

export function DocumentTags({ tags }: Props) {
  const router = useRouter();

  if (!tags) return null;

  return (
    <div className="flex w-full overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
      <div className="flex gap-2">
        {tags?.map((tag: Tag) => (
          <button
            key={tag.tag.id}
            type="button"
            onClick={() => {
              router.push(`/vault?tags=${tag.tag.id}`);
            }}
          >
            <Badge variant="tag-rounded">{tag.tag.name}</Badge>
          </button>
        ))}
      </div>
    </div>
  );
}
