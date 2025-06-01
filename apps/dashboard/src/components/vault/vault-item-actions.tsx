"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

  const signedUrlMutation = useMutation(
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
        queryClient.invalidateQueries({
          queryKey: trpc.documents.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.search.global.queryKey(),
        });
      },
    }),
  );

  return (
    <div className="flex flex-row gap-2">
      <a href={`${downloadUrl}&filename=${fileName}`} download>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full size-7 bg-background"
        >
          <Icons.ArrowCoolDown className="size-3.5" />
        </Button>
      </a>

      <Button
        variant="outline"
        size="icon"
        type="button"
        onClick={() =>
          signedUrlMutation.mutate({
            filePath: filePath.join("/"),
            expireIn: 60 * 60 * 24 * 30, // 30 days
          })
        }
        className="rounded-full size-7 bg-background"
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
          className="rounded-full size-7 bg-background"
          onClick={() => deleteDocumentMutation.mutate({ id })}
        >
          <Icons.Delete className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
