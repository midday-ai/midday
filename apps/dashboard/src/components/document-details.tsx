"use client";

import { DocumentActions } from "@/components/document-actions";
import { DocumentDetailsSkeleton } from "@/components/document-details-skeleton";
import { DocumentTags } from "@/components/document-tags";
import { FileViewer } from "@/components/file-viewer";
import { VaultRelatedFiles } from "@/components/vault/vault-related-files";
import { useDocumentParams } from "@/hooks/use-document-params";
import { useTRPC } from "@/trpc/client";
import { formatSize } from "@/utils/format";
import { SheetHeader } from "@midday/ui/sheet";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function DocumentDetails() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { params } = useDocumentParams();

  const isOpen = Boolean(params.filePath || params.id);
  const fullView = Boolean(params.id);

  const { data, isLoading } = useQuery({
    ...trpc.documents.getById.queryOptions({
      filePath: params.filePath!,
      id: params.id!,
    }),
    enabled: isOpen,
    staleTime: 60 * 1000,
    initialData: () => {
      const pages = queryClient
        .getQueriesData({ queryKey: trpc.documents.get.infiniteQueryKey() })
        .flatMap(([, data]) => data?.pages ?? [])
        .flatMap((page) => page.data ?? []);

      return pages.find(
        (d) =>
          d.id === params.id || d.path_tokens?.join("/") === params.filePath,
      );
    },
  });
  if (isLoading) {
    return <DocumentDetailsSkeleton fullView={fullView} />;
  }

  return (
    <div className="flex flex-col flex-grow min-h-0 relative h-full w-full">
      <SheetHeader className="mb-4 flex justify-between items-center flex-row">
        <div className="min-w-0 flex-1 max-w-[70%] flex flex-row gap-2 items-end">
          <h2 className="text-lg truncate flex-0">
            {data?.title ?? data?.name?.split("/").at(-1)}
          </h2>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {/* @ts-expect-error - size is not typed (JSONB) */}
            {data?.metadata?.size && formatSize(data?.metadata?.size)}
          </span>
        </div>

        <DocumentActions showDelete={fullView} filePath={data?.path_tokens} />
      </SheetHeader>

      <div className="h-full max-h-[763px] p-0 pb-4 overflow-x-auto scrollbar-hide">
        <div className="flex flex-col flex-grow min-h-0 relative h-full w-full items-center justify-center">
          <FileViewer
            url={`/api/proxy?filePath=vault/${data?.path_tokens?.join("/")}`}
            // @ts-expect-error - mimetype is not typed (JSONB)
            mimeType={data?.metadata?.mimetype}
            maxWidth={565}
          />
        </div>
      </div>

      <div>
        {data?.summary && (
          <p className="text-sm text-[#878787] mb-4 line-clamp-2">
            {data?.summary}
          </p>
        )}

        <DocumentTags tags={data?.tags} id={data?.id} />

        {fullView && <VaultRelatedFiles />}
      </div>
    </div>
  );
}
