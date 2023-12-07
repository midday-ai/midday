import { createClient } from "@midday/supabase/client";
import { PinInput } from "@midday/ui/pin-input";
import Image from "next/image";
import { useEffect, useState } from "react";

export function EnrollMFA({
  onEnrolled,
  onCancelled,
}: {
  onEnrolled: () => void;
  onCancelled: () => void;
}) {
  const supabase = createClient();
  const [factorId, setFactorId] = useState("");
  const [qr, setQR] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [error, setError] = useState("");

  const onEnableClicked = () => {
    setError("");

    (async () => {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) {
        setError(challenge.error.message);
        throw challenge.error;
      }

      const challengeId = challenge.data.id;

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: verifyCode,
      });
      if (verify.error) {
        setError(verify.error.message);
        throw verify.error;
      }

      onEnrolled();
    })();
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
      {error && <div className="error">{error}</div>}
      <div className="w-[200px] h-[200px] bg-white">
        <Image src={qr} alt="qr" width={200} height={200} />
      </div>
      <PinInput
      // type="text"
      // value={verifyCode}
      // onChange={(e) => setVerifyCode(e.target.value.trim())}
      />
    </>
  );
}
