import { createClient } from "@midday/supabase/client";
import { cn } from "@midday/ui/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PinField from "react-pin-field";

export function VerifyMfa() {
  const [isValidating, setValidating] = useState(false);
  const [error, setError] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const onComplete = async (code: string) => {
    setError(false);

    if (!isValidating) {
      setValidating(true);

      const factors = await supabase.auth.mfa.listFactors();

      if (factors.error) {
        setValidating(false);
        setError(true);
      }

      const totpFactor = factors.data.totp[0];

      if (!totpFactor) {
        setValidating(false);
        setError(true);
        return;
      }

      const factorId = totpFactor.id;

      const challenge = await supabase.auth.mfa.challenge({ factorId });

      if (challenge.error) {
        setValidating(false);
        setError(true);
        return;
      }

      const challengeId = challenge.data.id;

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });

      if (verify.error) {
        setValidating(false);
        setError(true);
        return;
      }

      router.replace("/");
    }
  };

  return (
    <>
      <div className="pb-4 bg-gradient-to-r from-primary dark:via-primary dark:to-[#848484] to-[#000] inline-block text-transparent bg-clip-text">
        <h1 className="font-medium pb-1 text-3xl">Verify your identity.</h1>
      </div>

      <div className="mb-8">
        <p className="font-medium pb-1 text-2xl text-[#606060]">
          Please enter the code from your authenticator app.
        </p>
      </div>

      <div className="flex w-full mb-6">
        <PinField
          className={cn("pin-field", error && "invalid")}
          onComplete={onComplete}
          format={(k) => k.toUpperCase()}
          length={6}
          autoFocus
          disabled={isValidating}
          autoComplete="one-time-password"
        />
      </div>

      <p className="text-xs text-[#878787]">
        Open your authenticator apps like 1Password, Authy, etc. to verify your
        identity.
      </p>
    </>
  );
}
