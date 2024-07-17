import { Button } from "@midday/ui/button";
import { Loader2 } from "lucide-react";

type Props = {
  onClick: () => void;
  isLoading: boolean;
};

export function BankConnectButton({ onClick, isLoading }: Props) {
  return (
    <Button
      variant="outline"
      data-event="Bank Selected"
      data-icon="🏦"
      data-channel="bank"
      disabled={isLoading}
      onClick={onClick}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connect"}
    </Button>
  );
}
