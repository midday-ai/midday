"use client";

import { authClient } from "@midday/auth/client";
import { Button } from "@midday/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@midday/ui/collapsible";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@midday/ui/input-otp";
import { Spinner } from "@midday/ui/spinner";
import { CaretSortIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { mfaVerifyAction } from "@/actions/mfa-verify-action";
import { clearAccessToken } from "@/utils/session";
import { CopyInput } from "./copy-input";

type Props = { replace?: boolean; onDone?: () => void; onCancel?: () => void };

export function LocalEnrollMFA({ replace = false, onDone, onCancel }: Props) {
  const router = useRouter();
  const started = useRef(false);
  const busy = useRef(false);
  const [qr, setQR] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verified, setVerified] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const pending = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    async function enroll() {
      try {
        if (replace) {
          const disabled = await authClient.twoFactor.disable({});
          if (disabled.error) throw new Error(disabled.error.message);
        }
        const result = await authClient.twoFactor.enable({});
        if (result.error || result.data?.method !== "totp")
          throw new Error(
            result.error?.message ?? "Could not set up your authenticator.",
          );
        pending.current = true;
        setSecret(
          new URL(result.data.totpURI).searchParams.get("secret") ?? "",
        );
        setBackupCodes(result.data.backupCodes);
        setQR(await QRCode.toDataURL(result.data.totpURI, { width: 220 }));
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Could not set up your authenticator.",
        );
      } finally {
        setLoading(false);
      }
    }
    void enroll();
  }, [replace]);

  const finish = () => {
    clearAccessToken();
    if (onDone) onDone();
    else {
      router.replace("/");
      router.refresh();
    }
  };
  const onComplete = async (code: string) => {
    if (busy.current || !pending.current) return;
    busy.current = true;
    setLoading(true);
    setError("");
    try {
      const result = await mfaVerifyAction({ method: "totp", code });
      if (!result?.data?.verified)
        throw new Error(
          result?.serverError ?? "Invalid code. Please try again.",
        );
      pending.current = false;
      clearAccessToken();
      setVerified(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not verify the code.");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };
  const cancel = async () => {
    if (isLoading || busy.current) return;
    setLoading(true);
    if (pending.current && !verified)
      await authClient.twoFactor.disable({}).catch(() => undefined);
    clearAccessToken();
    if (onCancel) onCancel();
    else router.push("/");
  };

  if (verified)
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-serif">Save your backup codes</h2>
        <p className="text-sm text-muted-foreground">
          Each code can be used once if you lose your authenticator. Save them
          somewhere safe before continuing.
        </p>
        <div className="grid grid-cols-2 gap-2 border p-4 font-mono text-sm">
          {backupCodes.map((code) => (
            <span key={code}>{code}</span>
          ))}
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(backupCodes.join("\n"));
              setCopied(true);
            } catch {
              setError("Could not copy. Please save the codes manually.");
            }
          }}
        >
          {copied ? "Copied" : "Copy backup codes"}
        </Button>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button className="w-full" onClick={finish}>
          I saved my backup codes
        </Button>
      </div>
    );

  return (
    <>
      <div className="flex items-center justify-center">
        <div className="w-[220px] h-[220px] bg-white rounded-md">
          {qr && (
            <Image
              src={qr}
              alt="Authenticator setup QR code"
              width={220}
              height={220}
              unoptimized
            />
          )}
        </div>
      </div>
      <p className="my-6 text-sm text-muted-foreground">
        Scan this QR code with your authenticator app, then enter its six-digit
        code to finish setup.
      </p>
      {secret && (
        <Collapsible className="w-full mb-4">
          <CollapsibleTrigger className="p-0 text-sm w-full flex justify-between">
            <span>Use setup key</span>
            <CaretSortIcon className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CopyInput value={secret} />
          </CollapsibleContent>
        </Collapsible>
      )}
      <div className="flex justify-center py-3">
        {isLoading ? (
          <Spinner size={20} />
        ) : (
          <InputOTP
            aria-label="Authenticator code"
            maxLength={6}
            autoFocus
            onComplete={onComplete}
            disabled={!qr}
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
      {error && (
        <p role="alert" className="text-sm text-destructive mt-3">
          {error}
        </p>
      )}
      <div className="flex border-t pt-4 mt-6 justify-center">
        <Button onClick={cancel} disabled={isLoading} variant="ghost">
          Cancel
        </Button>
      </div>
    </>
  );
}
