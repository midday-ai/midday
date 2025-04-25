"use client";

import { DocumentActions } from "@/components/document-actions";
import { DocumentDetailsSkeleton } from "@/components/document-details-skeleton";
import { DocumentTags } from "@/components/document-tags";
import { FileViewer } from "@/components/file-viewer";
import { useDocumentParams } from "@/hooks/use-document-params";
import { useTRPC } from "@/trpc/client";
import { formatSize } from "@/utils/format";
import { ScrollArea } from "@midday/ui/scroll-area";
import { SheetHeader } from "@midday/ui/sheet";
import { useQuery } from "@tanstack/react-query";

export function DocumentDetails() {
  const trpc = useTRPC();
  const { params } = useDocumentParams();

  const isOpen = Boolean(params.filePath || params.id);

  const { data, isLoading } = useQuery({
    ...trpc.documents.getById.queryOptions({
      filePath: params.filePath!,
      id: params.id!,
    }),
    enabled: isOpen,
  });

  if (isLoading) {
    return <DocumentDetailsSkeleton />;
  }

  return (
    <div className="flex flex-col flex-grow min-h-0 relative h-full w-full">
      <SheetHeader className="mb-4 flex justify-between items-center flex-row">
        <div className="min-w-0 flex-1 max-w-[70%] flex flex-row gap-2 items-end">
          <h2 className="text-lg truncate flex-0">
            {data?.title ?? data?.name?.split("/").at(-1)}
          </h2>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {data?.metadata?.size && formatSize(data?.metadata?.size)}
          </span>
        </div>

        <DocumentActions
          showDelete={Boolean(params.id)}
          filePath={data?.path_tokens}
        />
      </SheetHeader>

      <div className="h-full max-h-[763px] p-0 pb-8 overflow-x-auto scrollbar-hide">
        <div className="flex flex-col flex-grow min-h-0 relative h-full w-full items-center justify-center">
          <FileViewer
            url={`/api/proxy?filePath=vault/${data?.path_tokens?.join("/")}`}
            mimeType={data?.metadata?.mimetype}
            maxWidth={565}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        {data?.summary && (
          <p className="text-sm text-[#878787] mb-4 line-clamp-2">
            {data?.summary}
          </p>
        )}

        <DocumentTags tags={data?.tags} />
      </div>
    </div>
  );
}
