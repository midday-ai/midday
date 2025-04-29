"use client";

import { BotMessage } from "@/components/chat/messages";
import { FilePreview } from "@/components/file-preview";
import { VaultItemActions } from "@/components/vault/vault-item-actions";
import type { GetInboxResult } from "@/lib/tools/get-inbox";
import { useTRPC } from "@/trpc/client";
import { Skeleton } from "@midday/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

type Props = {
  result: GetInboxResult;
};

export function Inbox({ result }: Props) {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.inbox.get.queryOptions({
      filter: {
        q: result.params.name,
      },
    }),
  );

  if (isLoading) {
    return null;
  }

  return (
    <BotMessage>
      <div className="overflow-auto space-x-4 flex scrollbar-hide pr-4">
        {data?.data.map((document) => (
          <div key={document.id} className="w-[150px] flex-shrink-0 relative">
            {/* @ts-expect-error - mimetype is not typed (JSONB) */}
            {document?.metadata?.mimetype === "image/heic" ? (
              <Skeleton className="absolute inset-0 w-full h-full" />
            ) : (
              <div className="relative group/file">
                <FilePreview
                  filePath={document?.file_path?.join("/") ?? ""}
                  mimeType={document.content_type ?? ""}
                />

                <div className="absolute top-2 right-2 opacity-0 group-hover/file:opacity-100 transition-opacity duration-200">
                  <VaultItemActions
                    id={document.id}
                    filePath={document?.file_path ?? []}
                    hideDelete
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </BotMessage>
  );
}
