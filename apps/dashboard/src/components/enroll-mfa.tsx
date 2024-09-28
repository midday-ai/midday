import { createClient } from "@midday/supabase/client";
import { Button } from "@midday/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@midday/ui/collapsible";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@midday/ui/input-otp";
import { CaretSortIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CopyInput } from "./copy-input";

export function EnrollMFA() {
  const supabase = createClient();
  const router = useRouter();
  const [isValidating, setValidating] = useState(false);
  const [factorId, setFactorId] = useState("");
  const [qr, setQR] = useState("");
  const [secret, setSecret] = useState();
  const [error, setError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const onComplete = async (code: string) => {
    setError(false);

    if (!isValidating) {
      setValidating(true);

      const challenge = await supabase.auth.mfa.challenge({ factorId });

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code,
      });

      if (verify.data) {
        router.replace("/");
      }
    }
  };

  useEffect(() => {
    async function enroll() {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "app.midday.ai",
      });

      if (error) {
        throw error;
      }

      setFactorId(data.id);

      setQR(data.totp.qr_code);
      setSecret(data.totp.secret);
    }

    enroll();
  }, []);

  const handleOnCancel = () => {
    supabase.auth.mfa.unenroll({
      factorId,
    });

    router.push("/");
  };

  return (
    <>
      <div className="flex items-center justify-center">
        <div className="w-[220px] h-[220px] bg-white rounded-md">
          {qr && (
            <Image src={qr} alt="qr" width={220} height={220} quality={100} />
          )}
        </div>
      </div>
      <div className="my-8">
        <p className="font-medium pb-1 text-2xl text-[#606060]">
          Use an authenticator app to scan the following QR code, and provide
          the code to complete the setup.
        </p>
      </div>

      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full mb-4"
      >
        <CollapsibleTrigger className="p-0 text-sm w-full">
          <div className="flex items-center justify-between">
            <span className="font-medium">Use setup key</span>
            <CaretSortIcon className="h-4 w-4" />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {secret && <CopyInput value={secret} className="w-full" />}
        </CollapsibleContent>
      </Collapsible>

      <div className="flex w-full">
        <InputOTP
          className={error ? "invalid" : ""}
          maxLength={6}
          autoFocus
          onComplete={onComplete}
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

      <div className="flex border-t-[1px] pt-4 mt-6 justify-center mb-6">
        <Button
          onClick={handleOnCancel}
          variant="ghost"
          className="text-medium text-sm hover:bg-transparent"
        >
          Cancel
        </Button>
      </div>
    </>
  );
}
