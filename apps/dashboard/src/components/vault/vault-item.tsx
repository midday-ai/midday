"use client";

import { FilePreview } from "@/components/file-preview";
import { VaultItemTags } from "@/components/vault/vault-item-tags";
import { useDocumentParams } from "@/hooks/use-document-params";
import type { RouterOutputs } from "@/trpc/routers/_app";
import { cn } from "@midday/ui/cn";
import { Skeleton } from "@midday/ui/skeleton";
import { VaultItemActions } from "./vault-item-actions";

type Props = {
  data: RouterOutputs["documents"]["get"]["data"][number];
};

export function VaultItem({ data }: Props) {
  const { setParams } = useDocumentParams();

  const isLoading = data.processing_status === "pending";

  return (
    <div className="h-72 border relative flex text-muted-foreground p-4 flex-col gap-3 hover:bg-muted dark:hover:bg-[#141414] transition-colors duration-200 group">
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <VaultItemActions id={data.id} filePath={data.path_tokens ?? []} />
      </div>

      <button
        type="button"
        className={cn(
          "w-[60px] h-[84px] flex items-center justify-center",
          (data?.metadata as { mimetype?: string })?.mimetype?.startsWith(
            "image/",
          ) && "bg-border",
        )}
        onClick={() => {
          setParams({ id: data.id });
        }}
      >
        <FilePreview
          filePath={data?.path_tokens?.join("/") ?? ""}
          mimeType={(data?.metadata as { mimetype?: string })?.mimetype ?? ""}
        />
      </button>

      <button
        type="button"
        className="flex flex-col text-left"
        onClick={() => {
          setParams({ id: data.id });
        }}
      >
        {
          <h2 className="text-sm text-primary line-clamp-1 mb-2 mt-3">
            {isLoading ? (
              <Skeleton className="w-[80%] h-4" />
            ) : (
              (data?.title ?? data?.name?.split("/").at(-1))
            )}
          </h2>
        }

        {isLoading ? (
          <Skeleton className="w-[50%] h-4" />
        ) : (
          <p className="text-xs text-muted-foreground line-clamp-3">
            {data?.summary}
          </p>
        )}
      </button>

      <VaultItemTags tags={data?.tags} isLoading={isLoading} />
    </div>
  );
}
