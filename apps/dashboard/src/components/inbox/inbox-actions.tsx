"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";
import { AnimatePresence } from "framer-motion";
import { MatchTransaction } from "./match-transaction";
import { SuggestedMatch } from "./suggested-match";

type Props = {
  data: RouterOutputs["inbox"]["getById"];
};

export function InboxActions({ data }: Props) {
  // Don't show matching actions for "other" documents (non-financial documents)
  const isOtherDocument = data?.status === "other" || data?.type === "other";

  if (isOtherDocument) {
    return null;
  }

  return (
    <AnimatePresence>
      {data?.status === "suggested_match" && !data?.transactionId && (
        <SuggestedMatch key="suggested-match" />
      )}

      {!data?.suggestion && <MatchTransaction key="match-transaction" />}
    </AnimatePresence>
  );
}
