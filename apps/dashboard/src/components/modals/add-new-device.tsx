"use client";

import { createClient } from "@midday/supabase/client";
import { Button } from "@midday/ui/button";
import { Dialog, DialogContent } from "@midday/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@midday/ui/input-otp";
import { Spinner } from "@midday/ui/spinner";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { mfaVerifyAction } from "@/actions/mfa-verify-action";

export function AddNewDeviceModal() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isValidating, setValidating] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [factorId, setFactorId] = useState("");
  const [error, setError] = useState(false);
  const [qr, setQR] = useState("");
  const isOpen = searchParams.get("add") === "device";

  const verify = useAction(mfaVerifyAction, {
    onSuccess: () => {
      setIsRedirecting(true);
      router.push(pathname);
    },
  });

  const onComplete = async (code: string) => {
    if (!isValidating) {
      setValidating(true);

      const challenge = await supabase.auth.mfa.challenge({ factorId });

      if (!challenge.data) {
        setError(true);
        return;
      }

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
            <div className="h-16 w-full max-w-fit flex items-center justify-center">
              {isValidating || isRedirecting ? (
                <div className="flex items-center justify-center h-full bg-background/95 border border-input px-4">
                  <div className="flex items-center space-x-2 bg-background px-4 py-2 rounded-md shadow-sm">
                    <Spinner size={16} className="text-primary" />
                    <span className="text-sm text-foreground font-medium">
                      {isRedirecting ? "Closing..." : "Adding device..."}
                    </span>
                  </div>
                </div>
              ) : (
                <InputOTP
                  maxLength={6}
                  onComplete={onComplete}
                  autoFocus
                  disabled={isValidating || isRedirecting}
                  className={error ? "invalid" : ""}
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
