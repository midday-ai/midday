"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useMutation } from "@tanstack/react-query";
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

  const filename = filePath?.at(-1);

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
        <Button variant="ghost" size="icon">
          <Icons.Delete className="size-4" />
        </Button>
      )}
    </div>
  );
}
