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
    ...trpc.documents.getByPath.queryOptions({
      filePath: params.filePath!,
    }),
    enabled: isOpen,
  });

  if (isLoading) {
    return <DocumentDetailsSkeleton />;
  }

  return (
    <div className="flex flex-col flex-grow min-h-0 relative h-full w-full">
      <SheetHeader className="mb-4 flex justify-between items-center flex-row">
        <div className="min-w-0 flex-1 max-w-[50%] flex flex-row gap-2 items-end">
          <h2 className="text-lg truncate flex-0">
            {data?.name?.split("/").pop()}
          </h2>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {data?.metadata?.size && formatSize(data?.metadata?.size)}
          </span>
        </div>

        <DocumentActions
          showDelete={Boolean(params.id)}
          downloadUrl={`/api/download/file?path=${data?.path_tokens?.join(
            "/",
          )}&filename=${data?.name?.split("/").pop()}`}
        />
      </SheetHeader>

      <ScrollArea className="h-full max-h-[763px] p-0 pb-8" hideScrollbar>
        <div className="flex flex-col flex-grow min-h-0 relative h-full w-full">
          <FileViewer
            url={`/api/proxy?filePath=vault/${data?.path_tokens?.join("/")}`}
            mimeType={data?.metadata?.mimetype}
            maxWidth={565}
          />
        </div>
      </ScrollArea>

      <div className="pt-4 border-t border-border">
        <p className="text-sm text-[#878787] mb-4 line-clamp-2">
          Invoice sent to Acme Corp for $4,200 regarding the Expansion Project.
          Generated Jan 5 and marked as paid.
        </p>

        <DocumentTags />
      </div>
    </div>
  );
}
