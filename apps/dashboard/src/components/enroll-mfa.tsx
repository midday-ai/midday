import { createClient } from "@midday/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PinField from "react-pin-field";

export function EnrollMFA() {
  const supabase = createClient();
  const router = useRouter();
  const [isValidating, setValidating] = useState(false);
  const [factorId, setFactorId] = useState("");
  const [qr, setQR] = useState("");

  const onComplete = async (code: string) => {
    if (!isValidating) {
      setValidating(true);

      const challenge = await supabase.auth.mfa.challenge({ factorId });

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code,
      });

      if (verify.data) {
        router.replace("/onboarding");
      }
    }
  };

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });

      if (error) {
        throw error;
      }

      setFactorId(data.id);

      setQR(data.totp.qr_code);
    })();
  }, []);

  return (
    <>
      <div className="flex items-center justify-center">
        <div className="w-[300px] h-[300px]">
          {qr && <Image src={qr} alt="qr" width={300} height={300} />}
        </div>
      </div>
      <div className="my-8">
        <p className="font-medium pb-1 text-2xl text-[#606060]">
          Use an authenticator app to scan the following QR code, and provide
          the code to complete the setup.
        </p>
      </div>

      <div className="flex w-full">
        <PinField
          className="pin-field"
          onComplete={onComplete}
          format={(k) => k.toUpperCase()}
          length={6}
          autoFocus
          disabled={isValidating}
          autoComplete="one-time-password"
        />
      </div>

      <div className="flex border-t-[1px] pt-4 mt-6 justify-center mb-6">
        <Link href="/onboarding" className="text-medium text-sm">
          Cancel
        </Link>
      </div>
    </>
  );
}
