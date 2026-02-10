"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useRouter } from "next/navigation";
import { useConnectParams } from "@/hooks/use-connect-params";

export function ConnectBankMessage() {
  const { setParams } = useConnectParams();
  const router = useRouter();

  const handleConnect = () => {
    setParams({ step: "connect" });
  };

  const handleMaybeLater = () => {
    router.push("/");
  };

  return (
    <div className="w-full border p-4 space-y-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 size-7 flex items-center justify-center border text-primary bg-secondary">
          <Icons.Accounts size={15} />
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="text-foreground">Connect bank</h3>
          <p className="text-sm text-muted-foreground">
            To answer financial questions, I need access to your bank
            transactions and balances. Connect a bank to continue.
          </p>
        </div>
      </div>
      <div className="flex gap-2 ml-11">
        <Button onClick={handleConnect}>Connect</Button>
        <Button
          onClick={handleMaybeLater}
          variant="outline"
          className="text-primary"
        >
          Maybe later
        </Button>
      </div>
    </div>
  );
}
