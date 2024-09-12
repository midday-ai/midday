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
  const { execute, optimisticState } = useOptimisticAction(voteAction, {
    currentState: count,
    updateFn: () => {
      return +count + 1;
    },
  });

  return (
    <Button
      variant="outline"
      className="p-6 flex-col w-14 h-16"
      onClick={() => execute({ id })}
    >
      <div className="flex space-x-2 items-center flex-col">
        <ChevronUp size={16} />
        {optimisticState}
      </div>
    </Button>
  );
}
