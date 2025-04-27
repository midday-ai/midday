"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import { useCopyToClipboard } from "usehooks-ts";

type Props = {
  id: string;
  filePath: string[];
  hideDelete?: boolean;
};

export function VaultItemActions({ id, filePath, hideDelete }: Props) {
  const [, copy] = useCopyToClipboard();
  const [isCopied, setIsCopied] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const downloadUrl = `/api/download/file?path=${filePath.join("/")}`;
  const fileName = filePath.at(-1);

  const shareDocumentMutation = useMutation(
    trpc.documents.share.mutationOptions({
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
    <div className="flex flex-row gap-2">
      <a href={`${downloadUrl}&filename=${fileName}`} download>
        <Button variant="outline" size="icon" className="rounded-full size-7">
          <Icons.ArrowCoolDown className="size-3.5" />
        </Button>
      </a>

      <Button
        variant="outline"
        size="icon"
        onClick={() =>
          shareDocumentMutation.mutate({
            filePath: filePath.join("/"),
            expireIn: 60 * 60 * 24 * 30, // 30 days
          })
        }
        className="rounded-full size-7"
      >
        {isCopied ? (
          <Icons.Check className="size-3.5 -mt-0.5" />
        ) : (
          <Icons.Copy className="size-3.5" />
        )}
      </Button>

      {!hideDelete && (
        <Button
          variant="outline"
          size="icon"
          className="rounded-full size-7"
          onClick={() => deleteDocumentMutation.mutate({ id })}
        >
          <Icons.Delete className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
