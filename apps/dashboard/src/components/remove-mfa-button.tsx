"use client";

import { unenrollMfaAction } from "@/actions/unenroll-mfa-action";
import { Button } from "@midday/ui/button";
import { useToast } from "@midday/ui/use-toast";
import { useAction } from "next-safe-action/hook";

type Props = {
  factoryId: string;
};

export function RemoveMFAButton({ factoryId }: Props) {
  const { toast } = useToast();

  const unenroll = useAction(unenrollMfaAction, {
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });
    },
  });

  return (
    <Button variant="outline" onClick={() => unenroll.execute({ factoryId })}>
      Remove
    </Button>
  );
}
