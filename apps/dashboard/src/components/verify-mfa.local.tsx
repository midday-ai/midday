"use client";

import { authClient } from "@midday/auth/client";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@midday/ui/input-otp";
import { Spinner } from "@midday/ui/spinner";
import { sanitizeRedirectPath } from "@midday/utils/sanitize-redirect";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { mfaVerifyAction } from "@/actions/mfa-verify-action";
import { clearAccessToken } from "@/utils/session";

export function LocalVerifyMfa() {
  const [isValidating, setValidating] = useState(false);
  const [error, setError] = useState("");
  const [method, setMethod] = useState<"totp" | "backup">("totp");
  const [backupCode, setBackupCode] = useState("");
  const busy = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const onComplete = async (code: string) => {
    if (busy.current) return;
    busy.current = true;
    setValidating(true);
    setError("");
    try {
      const result = await mfaVerifyAction({ method, code });
      if (!result?.data?.verified)
        throw new Error(
          result?.serverError ?? "Invalid code. Please try again.",
        );
      clearAccessToken();
      const raw = searchParams.get("return_to") ?? "/";
      const target = sanitizeRedirectPath(
        raw.startsWith("/") ? raw : `/${raw}`,
      );
      router.replace(target === "/mfa/verify" ? "/" : target);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not verify the code.");
      setValidating(false);
      busy.current = false;
    }
  };
  return (
    <>
      <div className="text-center pb-4">
        <h1 className="text-lg lg:text-xl mb-2 font-serif">
          Verify your identity.
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          {method === "totp"
            ? "Enter the code from your authenticator app."
            : "Enter one of your saved backup codes."}
        </p>
      </div>
      <div className="flex justify-center mb-6">
        {isValidating ? (
          <Spinner size={20} />
        ) : method === "totp" ? (
          <InputOTP
            aria-label="Authenticator code"
            onComplete={onComplete}
            maxLength={6}
            autoFocus
            render={({ slots }) => (
              <InputOTPGroup>
                {slots.map((slot, index) => (
                  <InputOTPSlot key={index.toString()} {...slot} />
                ))}
              </InputOTPGroup>
            )}
          />
        ) : (
          <form
            className="w-full space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void onComplete(backupCode.trim());
            }}
          >
            <Input
              aria-label="Backup code"
              value={backupCode}
              onChange={(event) => setBackupCode(event.target.value)}
              autoComplete="off"
            />
            <Button className="w-full" disabled={!backupCode.trim()}>
              Verify backup code
            </Button>
          </form>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive text-center mb-4">
          {error}
        </p>
      )}
      <Button
        variant="ghost"
        disabled={isValidating}
        onClick={() => {
          setMethod(method === "totp" ? "backup" : "totp");
          setError("");
        }}
      >
        {method === "totp" ? "Use a backup code" : "Use authenticator app"}
      </Button>
      <Button
        variant="ghost"
        onClick={async () => {
          clearAccessToken();
          await authClient.signOut();
          router.replace("/login");
          router.refresh();
        }}
      >
        Sign out
      </Button>
    </>
  );
}
