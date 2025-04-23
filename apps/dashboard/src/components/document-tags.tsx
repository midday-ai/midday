"use client";

import { Badge } from "@midday/ui/badge";

const tags = [
  {
    label: "Invoice",
    slug: "invoice",
  },
  {
    label: "Notes",
    slug: "notes",
  },
  {
    label: "Acme Corp",
    slug: "acme-corp",
  },
  {
    label: "Contract",
    slug: "contract",
  },
  {
    label: "Receipt",
    slug: "receipt",
  },
  {
    label: "Tele 2",
    slug: "tele-2",
  },
  {
    label: "Q1",
    slug: "q1",
  },
  {
    label: "2025",
    slug: "2025",
  },
];

export function DocumentTags() {
  return (
    <div className="flex w-full overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
      <div className="flex gap-2">
        {tags.map((tag) => (
          <Badge key={tag.slug} variant="tag-rounded">
            {tag.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
