"use client";

import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import { SubmitButton } from "@midday/ui/submit-button";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

export function ConnectGmail() {
  const trpc = useTRPC();
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const provider = searchParams.get("provider");

  const connectMutation = useMutation(
    trpc.inbox.connect.mutationOptions({
      onSuccess: (data) => {
        if (data) {
          router.push(data);
        }
      },
    }),
  );

  return (
    <SubmitButton
      className="px-6 py-4 w-full font-medium flex space-x-2 h-[40px]"
      variant="outline"
      onClick={() => connectMutation.mutate({ provider: "gmail" })}
      isSubmitting={
        connectMutation.isPending ||
        (success === "true" && provider === "gmail")
      }
    >
      <Icons.Gmail />
      <span>Connect your Gmail</span>
    </SubmitButton>
  );
}
