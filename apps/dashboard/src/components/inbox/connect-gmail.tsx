"use client";

import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import { SubmitButton } from "@midday/ui/submit-button";
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
  );
}
