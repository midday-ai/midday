"use client";

import { Icons } from "@midday/ui/icons";
import { SubmitButton } from "@midday/ui/submit-button";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";

type Props = {
  redirectPath?: string;
};

export function ConnectGmail({ redirectPath }: Props) {
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
    <SubmitButton
      className="px-4 font-medium h-[40px]"
      variant="outline"
      onClick={() =>
        connectMutation.mutate({ provider: "gmail", redirectPath })
      }
      isSubmitting={connectMutation.isPending}
    >
      <div className="flex items-center space-x-2">
        <Icons.Gmail />
        <span>Connect Gmail</span>
      </div>
    </SubmitButton>
  );
}
