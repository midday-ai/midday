"use client";

import { Button } from "@midday/ui/button";
import { useQueryState } from "nuqs";

export function ConnectBankButton() {
  const [_, setStep] = useQueryState("step");

  return (
    <Button
      data-event="Connect Bank"
      data-icon="🏦"
      data-channel="bank"
      onClick={() => setStep("connect")}
    >
      Connect bank
    </Button>
  );
}
