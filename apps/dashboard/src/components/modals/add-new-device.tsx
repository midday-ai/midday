"use client";

import { mfaVerifyAction } from "@/actions/mfa-verify-action";
import { createClient } from "@midday/supabase/client";
import { Button } from "@midday/ui/button";
import { Dialog, DialogContent } from "@midday/ui/dialog";
import { cn } from "@midday/ui/utils";
import { useAction } from "next-safe-action/hooks";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import PinField from "react-pin-field";

export function AddNewDeviceModal() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isValidating, setValidating] = useState(false);
  const [factorId, setFactorId] = useState("");
  const [error, setError] = useState(false);
  const [qr, setQR] = useState("");
  const isOpen = searchParams.get("add") === "device";

  const verify = useAction(mfaVerifyAction, {
    onSuccess: () => router.push(pathname),
  });

  const onComplete = async (code: string) => {
    if (!isValidating) {
      setValidating(true);

      const challenge = await supabase.auth.mfa.challenge({ factorId });

      verify.execute({
        factorId,
        challengeId: challenge.data.id,
        code,
      });
    }
  };

  useEffect(() => {
    setValidating(false);
    setError(false);

    async function enroll() {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });

      if (error) {
        throw error;
      }

      setFactorId(data.id);

      setQR(data.totp.qr_code);
    }

    if (isOpen) {
      enroll();
    }
  }, [isOpen]);

  const handleOnClose = () => {
    router.push(pathname);

    supabase.auth.mfa.unenroll({
      factorId,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOnClose}>
      <DialogContent
        className="max-w-[455px]"
        onInteractOutside={(evt) => {
          evt.preventDefault();
        }}
      >
        <div className="p-6">
          <div className="flex items-center justify-center mt-8">
            <div className="w-[190px] h-[190px] bg-white rounded-md">
              {qr && (
                <Image
                  src={qr}
                  alt="qr"
                  width={190}
                  height={190}
                  quality={100}
                />
              )}
            </div>
          </div>

          <div className="my-8">
            <p className="font-medium pb-1 text-2xl text-[#606060]">
              Use an authenticator app to scan the following QR code, and
              provide the code to complete the setup.
            </p>
          </div>

          <div className="flex w-full justify-center">
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

          <div className="flex border-t-[1px] pt-4 mt-4 justify-center">
            <Button
              onClick={handleOnClose}
              variant="ghost"
              className="text-medium text-sm hover:bg-transparent"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
