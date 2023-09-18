"use client";

import { useState } from "react";
import { api } from "@/utils/api";

export function SignInWithOtp() {
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [verify, setVerify] = useState(false);
  const { mutateAsync: signInWithOtp } = api.auth.signInWithOtp.useMutation();
  const { mutateAsync: verifyOtp } = api.auth.verifyOtp.useMutation();

  const handleSignIn = async (evt: React.KeyboardEvent<HTMLInputElement>) => {
    if (evt.key === "Enter") {
      await signInWithOtp({ phone: evt.target.value });
      setVerify(true);
    }
  };

  const handleVerify = async (evt: React.KeyboardEvent<HTMLInputElement>) => {
    if (evt.target.value.length === 6) {
      const result = await verifyOtp({
        phone,
        token,
      });

      console.log(result);
    }
  };

  return verify ? (
    <input
      placeholder="Code"
      onChange={(evt) => setToken(evt.target.value)}
      onKeyDown={handleVerify}
      autoFocus
      name="code"
      value={token}
    />
  ) : (
    <input
      value={phone}
      onChange={(evt) => setPhone(evt.target.value)}
      name="phone"
      placeholder="Enter your phone number"
      onKeyDown={handleSignIn}
      type="phone"
    />
  );
}
