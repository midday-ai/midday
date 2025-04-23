"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useEffect, useState } from "react";
import { useCopyToClipboard } from "usehooks-ts";

type Props = {
  showDelete?: boolean;
  downloadUrl?: string;
};

export function DocumentActions({ showDelete = false, downloadUrl }: Props) {
  const [, copy] = useCopyToClipboard();
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  function handleCopy() {
    const url = window.location.href;
    copy(url);
    setIsCopied(true);
  }

  return (
    <div className="flex flex-row">
      {downloadUrl && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            window.open(downloadUrl, "_blank");
          }}
        >
          <Icons.ArrowCoolDown className="size-4" />
        </Button>
      )}

      <Button variant="ghost" size="icon" onClick={handleCopy}>
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
