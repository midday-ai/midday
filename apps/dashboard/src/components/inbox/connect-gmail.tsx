"use client";

import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import { SubmitButton } from "@midday/ui/submit-button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function ConnectGmail() {
  const trpc = useTRPC();
  const router = useRouter();

  const connectMutation = useMutation(
    trpc.inboxAccounts.connect.mutationOptions({
      onSuccess: (authUrl) => {
        if (authUrl) {
          router.push(authUrl);
        }
      },
    }),
  );

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <SubmitButton
            className="px-6 py-4 w-full font-medium h-[40px]"
            variant="outline"
            onClick={() => connectMutation.mutate({ provider: "gmail" })}
            isSubmitting={connectMutation.isPending}
          >
            <div className="flex items-center space-x-2">
              <Icons.Gmail />
              <span>Connect your Gmail</span>
            </div>
          </SubmitButton>
        </TooltipTrigger>
        <TooltipContent className="max-w-[300px] text-xs" sideOffset={10}>
          <p>
            We are currently in Google's verification review process. This is a
            standard procedure for all apps requesting Gmail access. You may see
            a warning screen - this is normal. Simply click{" "}
            <strong>Advanced</strong> →{" "}
            <strong>Go to midday.ai (unsafe)</strong> to safely proceed.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
