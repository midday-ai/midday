import { createClient } from "@midday/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@midday/ui/input-otp";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

      if (!factors.data) {
        setValidating(false);
        setError(true);
        return;
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
        <InputOTP
          onComplete={onComplete}
          maxLength={6}
          autoFocus
          className={error ? "invalid" : undefined}
          disabled={isValidating}
          render={({ slots }) => (
            <InputOTPGroup>
              {slots.map((slot, index) => (
                <InputOTPSlot key={index.toString()} {...slot} />
              ))}
            </InputOTPGroup>
          )}
        />
      </div>

      <p className="text-xs text-[#878787]">
        Open your authenticator apps like 1Password, Authy, etc. to verify your
        identity.
      </p>
    </>
  );
}
