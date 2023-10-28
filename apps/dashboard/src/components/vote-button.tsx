"use client";

import { voteAction } from "@/actions/vote-action";
import { Button } from "@midday/ui/button";
import { Loader2 } from "lucide-react";
import { ChevronUp } from "lucide-react";
import { useOptimistic, useTransition } from "react";

export function VoteButton({ count, id }) {
  const [isPending, startTransition] = useTransition();

  const [optimisticCount, addOptimisticCount] = useOptimistic(
    count,
    (currentState) => {
      return +currentState + 1;
    },
  );

  const handleVote = () => {
    startTransition(() => {
      addOptimisticCount();
      voteAction(id, "/apps");
    });
  };

  return (
    <Button variant="outline" className="p-6 flex-col" onClick={handleVote}>
      <div className="flex space-x-2 items-center flex-col">
        <ChevronUp size={16} />
        {optimisticCount}
      </div>
    </Button>
  );
}
