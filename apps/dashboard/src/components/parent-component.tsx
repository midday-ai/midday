"use client";

import { useSearchParams } from "next/navigation";
import { AddAccountButton } from "./add-account-button";
import { ConnectModal } from "./connect-modal";

export function ParentComponent() {
  const searchParams = useSearchParams();
  const step = searchParams.get("step");

  return (
    <div>
      <AddAccountButton />
      {step === "connect" && <ConnectModal />}
    </div>
  );
}
