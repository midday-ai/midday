"use client";

import { useDocumentParams } from "@/hooks/use-document-params";
import type { RouterOutputs } from "@/trpc/routers/_app";
import { Badge } from "@midday/ui/badge";
import { useRouter } from "next/navigation";

type Props = {
  files: RouterOutputs["documents"]["get"]["data"];
};

export function Vault({ files }: Props) {
  const { setParams } = useDocumentParams();
  const router = useRouter();

  return (
    <ul className="bullet-none divide-y cursor-pointer overflow-auto scrollbar-hide aspect-square pb-24">
      {files?.map((file) => {
        const firstTag = file.tags.at(0);

        return (
          <li key={file.id}>
            <div className="flex items-center py-3 justify-between">
              <span
                className="text-sm line-clamp-1 pr-8"
                onClick={() => {
                  setParams({
                    filePath: file.name,
                  });
                }}
              >
                {file.name?.split("/").at(-1)}
              </span>

              {file.tags.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    router.push(`/vault?tags=${firstTag?.tag.slug}`);
                  }}
                >
                  <Badge variant="tag-rounded" className="text-xs">
                    {firstTag?.tag.name}
                  </Badge>
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
