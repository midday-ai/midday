import { Spinner } from "@midday/ui/spinner";
import type { MutableRefObject } from "react";
import { useEffect, useState } from "react";

type Props = {
  onClick: () => void;
  connectRef?: MutableRefObject<(() => void) | null>;
};

export function BankConnectButton({ onClick, connectRef }: Props) {
  const [isLoading, setLoading] = useState(false);

  const handleOnClick = () => {
    if (isLoading) return;
    setLoading(true);
    onClick();

    setTimeout(() => {
      setLoading(false);
    }, 3000);
  };

  useEffect(() => {
    if (connectRef) {
      connectRef.current = handleOnClick;
    }
  });

  return (
    <span className="text-xs text-[#878787] group-hover:text-primary shrink-0 transition-colors duration-200">
      {isLoading ? <Spinner size={14} /> : "Connect"}
    </span>
  );
}
