"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";
import { AnimatePresence } from "framer-motion";
import { MatchTransaction } from "./match-transaction";
import { SuggestedMatch } from "./suggested-match";

type Props = {
  data: RouterOutputs["inbox"]["getById"];
};

export function InboxActions({ data }: Props) {
  const isOtherDocument = data?.status === "other" || data?.type === "other";

  if (isOtherDocument) {
    return null;
  }

  const hasSuggestion =
    data?.status === "suggested_match" &&
    !data?.transactionId &&
    !!data?.suggestion;

  return (
    <AnimatePresence>
      {hasSuggestion && <SuggestedMatch key="suggested-match" />}

      {!hasSuggestion && <MatchTransaction key="match-transaction" />}
    </AnimatePresence>
  );
}
