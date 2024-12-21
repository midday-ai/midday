import { useConnectParams } from "@/hooks/use-connect-params";
import { track } from "@midday/events/client";
import { LogEvents } from "@midday/events/events";
import { useTheme } from "next-themes";
import { useState } from "react";
import { PluggyConnect as PluggySDK } from "react-pluggy-connect";
import { BankConnectButton } from "./bank-connect-button";

type Props = {
  id: string;
  onSelect: (id: string) => void;
};

export function PluggyConnect({ id, onSelect }: Props) {
  const [institution, setInstitution] = useState<string | undefined>();
  const [isOpen, setIsOpen] = useState(false);
  const { setParams } = useConnectParams();
  const { theme } = useTheme();

  return (
    <>
      <BankConnectButton
        onClick={() => {
          onSelect(id);
          setInstitution(id);
          setIsOpen(true);
        }}
      />

      {isOpen && (
        <PluggySDK
          theme={theme as "light" | "dark"}
          selectedConnectorId={Number(institution)}
          connectToken={"your-connect-token-here"}
          onError={() => {
            setParams({ step: "connect" });
            track({
              event: LogEvents.ConnectBankCanceled.name,
              channel: LogEvents.ConnectBankCanceled.channel,
              provider: "pluggy",
            });

            setParams({ step: "connect" });
          }}
          onSuccess={() => {
            //   setParams({
            //     step: "account",
            //     provider: "pluggy",
            //     token: authorization.accessToken,
            //     enrollment_id: authorization.enrollment.id,
            //   });
            //   track({
            //     event: LogEvents.ConnectBankAuthorized.name,
            //     channel: LogEvents.ConnectBankAuthorized.channel,
            //     provider: "pluggy",
            //   });
          }}
        />
      )}
    </>
  );
}
