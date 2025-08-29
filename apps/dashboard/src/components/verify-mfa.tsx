import { createClient } from "@midday/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@midday/ui/input-otp";
import { Spinner } from "@midday/ui/spinner";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function VerifyMfa() {
  const [isValidating, setValidating] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

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

      setIsRedirecting(true);
      router.push(
        `${window.location.origin}/${searchParams.get("return_to") || ""}`,
      );
    }
  };

  return (
    <>
      <div className="pb-4">
        <div className="text-center">
          <h1 className="text-lg mb-2 font-serif">Verify your identity.</h1>
          <p className="text-[#878787] text-sm mb-8">
            Please enter the code from your authenticator app.
          </p>
        </div>
      </div>

      <div className="flex w-full mb-6">
        <div className="w-full h-16 flex items-center justify-center">
          {isValidating || isRedirecting ? (
            <div className="flex items-center justify-center h-full bg-background/95 border border-input w-full">
              <div className="flex items-center space-x-2 bg-background px-4 py-2 rounded-md shadow-sm">
                <Spinner size={16} className="text-primary" />
                <span className="text-sm text-foreground font-medium">
                  {isRedirecting ? "Redirecting..." : "Verifying..."}
                </span>
              </div>
            </div>
          ) : (
            <InputOTP
              onComplete={onComplete}
              maxLength={6}
              autoFocus
              className={error ? "invalid" : undefined}
              disabled={isValidating || isRedirecting}
              render={({ slots }) => (
                <InputOTPGroup>
                  {slots.map((slot, index) => (
                    <InputOTPSlot key={index.toString()} {...slot} />
                  ))}
                </InputOTPGroup>
              )}
            />
          )}
        </div>
      </div>

      <p className="text-xs text-[#878787] text-center font-mono">
        Open your authenticator apps like 1Password, Authy, etc. to verify your
        identity.
      </p>
    </>
  );
}
