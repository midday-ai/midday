import * as PluggyConnect from "pluggy-connect-sdk";
import { useEffect, useState } from "react";

type Props = {
  token: string;
  institutionId?: string;
  onExit: () => void;
  onSuccess: (itemData: any) => void;
  onError: () => void;
  includeSandbox?: boolean;
  theme?: "light" | "dark";
  language?: string;
};

export function usePluggyLink({
  token,
  institutionId,
  onExit,
  onSuccess,
  onError,
  includeSandbox = false,
  language = "pt",
  theme,
}: Props) {
  const [connectToken, setConnectToken] = useState<string>("");
  const [selectedConnectorId, setSelectedConnectorId] = useState<
    number | undefined
  >(institutionId ? Number(institutionId) : undefined);

  useEffect(() => {
    setConnectToken(token);
  }, [token]);

  const pluggyConnect = new PluggyConnect.PluggyConnect({
    connectToken,
    includeSandbox,
    selectedConnectorId,
    onClose: onExit,
    onSuccess,
    onError,
    theme,
    language,
  });

  const handleOpen = ({ institutionId }: { institutionId?: string }) => {
    setSelectedConnectorId(Number(institutionId));
    pluggyConnect.init();
  };

  return {
    open: handleOpen,
  };
}
