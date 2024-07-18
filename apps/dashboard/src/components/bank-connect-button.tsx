import { Button } from "@midday/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";

type Props = {
  onClick: () => void;
};

export function BankConnectButton({ onClick }: Props) {
  const [isLoading, setLoading] = useState(false);

  const handleOnClick = () => {
    setLoading(true);
    onClick();

    setTimeout(() => {
      setLoading(false);
    }, 3000);
  };

  return (
    <Button
      variant="outline"
      data-event="Bank Selected"
      data-icon="🏦"
      data-channel="bank"
      disabled={isLoading}
      onClick={handleOnClick}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connect"}
    </Button>
  );
}
