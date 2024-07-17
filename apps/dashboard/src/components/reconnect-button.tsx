"use client";

// import { createEndUserAgreementAction } from "@/actions/banks/create-end-user-agreement-action";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
// import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
// import { useAction } from "next-safe-action/hooks";

type Props = {
  institutionId: string;
};

export function ReconnectButton({ institutionId }: Props) {
  // const createEndUserAgreement = useAction(createEndUserAgreementAction);

  return (
    <Button
      variant="outline"
      // onClick={() =>
      //   createEndUserAgreement.execute({
      //     isDesktop: isDesktopApp(),
      //     institutionId,
      //     transactionTotalDays: 30,
      //   })
      // }
    >
      Reconnect
    </Button>
  );
}
