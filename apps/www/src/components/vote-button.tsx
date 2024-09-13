"use client";

import { voteAction } from "@/actions/vote-action";
import { Button } from "@midday/ui/button";
import { ChevronUp } from "lucide-react";
import { useOptimisticAction } from "next-safe-action/hooks";

type Props = {
  id: string;
  count: number;
};

export function VoteButton({ count, id }: Props) {
  const { execute, optimisticData } = useOptimisticAction(
    voteAction,
    count,
    (prevCount) => {
      return +prevCount + 1;
    },
  );

  return (
    <Button
      variant="outline"
      className="h-16 w-14 flex-col p-6"
      onClick={() => execute({ id })}
    >
      <div className="flex flex-col items-center space-x-2">
        <ChevronUp size={16} />
        {optimisticData}
      </div>
    </Button>
  );
}
