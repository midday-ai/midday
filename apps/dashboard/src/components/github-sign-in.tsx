"use client";

import { useOAuthSignIn } from "@/hooks/use-oauth-signin";
import { Icons } from "@midday/ui/icons";
import { SubmitButton } from "@midday/ui/submit-button";

export function GithubSignIn() {
  const { isLoading, signIn } = useOAuthSignIn({
    provider: "github",
    useReturnTo: true,
  });

  return (
    <SubmitButton
      onClick={signIn}
      className="bg-primary px-6 py-4 text-secondary font-medium h-[40px] w-full"
      isSubmitting={isLoading}
    >
      <div className="flex items-center space-x-2">
        <Icons.Github />
        <span>Continue with Github</span>
      </div>
    </SubmitButton>
  );
}
