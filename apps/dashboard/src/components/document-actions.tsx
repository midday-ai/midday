"use client";

import { useDocumentParams } from "@/hooks/use-document-params";
import { downloadFile } from "@/lib/download";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useCopyToClipboard } from "usehooks-ts";

type Props = {
  showDelete?: boolean;
  filePath?: string[] | null;
};

export function DocumentActions({ showDelete = false, filePath }: Props) {
  const [, copy] = useCopyToClipboard();
  const [isCopied, setIsCopied] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setParams, params } = useDocumentParams();

  const filename = filePath?.at(-1);

  const shareDocumentMutation = useMutation(
    trpc.documents.signedUrl.mutationOptions({
      onMutate: () => {
        setIsCopied(true);
      },
      onSuccess: (data) => {
        if (data?.signedUrl) {
          copy(data.signedUrl);

          setTimeout(() => {
            setIsCopied(false);
          }, 3000);
        }
      },
    }),
  );

  const deleteDocumentMutation = useMutation(
    trpc.documents.delete.mutationOptions({
      onSuccess: () => {
        setParams({ documentId: null });

        queryClient.invalidateQueries({
          queryKey: trpc.documents.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.documents.get.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.search.global.queryKey(),
        });
      },
    }),
  );

  return (
    <div className="flex flex-row">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          if (filePath && filename) {
            downloadFile(
              `/api/download/file?path=${filePath.join("/")}&filename=${filename}`,
              filename,
            );
          }
        }}
      >
        <Icons.ArrowCoolDown className="size-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() =>
          shareDocumentMutation.mutate({
            filePath: filePath?.join("/") ?? "",
            expireIn: 60 * 60 * 24 * 30, // 30 days
          })
        }
      >
        {isCopied ? (
          <Icons.Check className="size-4" />
        ) : (
          <Icons.Copy className="size-4" />
        )}
      </Button>

      {showDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            deleteDocumentMutation.mutate({
              id: params.documentId!,
            })
          }
        >
          <Icons.Delete className="size-4" />
        </Button>
      )}
    </div>
  );
}
