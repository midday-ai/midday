"use client";

import { useDocumentParams } from "@/hooks/use-document-params";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
      onMutate: async ({ id }) => {
        setParams({ id: null });

        // Cancel outgoing refetches
        await queryClient.cancelQueries({
          queryKey: trpc.documents.get.infiniteQueryKey(),
        });

        // Get current data
        const previousData = queryClient.getQueriesData({
          queryKey: trpc.documents.get.infiniteQueryKey(),
        });

        // Optimistically update infinite query data
        queryClient.setQueriesData(
          { queryKey: trpc.documents.get.infiniteQueryKey() },
          (old: InfiniteData<any>) => ({
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.filter((item: any) => item.id !== id),
            })),
            pageParams: old.pageParams,
          }),
        );

        return { previousData };
      },
      onError: (_, __, context) => {
        // Restore previous data on error
        if (context?.previousData) {
          queryClient.setQueriesData(
            { queryKey: trpc.documents.get.infiniteQueryKey() },
            context.previousData,
          );
        }
      },
      onSettled: () => {
        // Refetch after error or success
        queryClient.invalidateQueries({
          queryKey: trpc.documents.get.infiniteQueryKey(),
        });
      },
    }),
  );

  return (
    <div className="flex flex-row">
      <a
        href={`/api/download/file?path=${filePath?.join("/")}&filename=${filename}`}
        download
      >
        <Button variant="ghost" size="icon">
          <Icons.ArrowCoolDown className="size-4" />
        </Button>
      </a>

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
              id: params.id!,
            })
          }
        >
          <Icons.Delete className="size-4" />
        </Button>
      )}
    </div>
  );
}
