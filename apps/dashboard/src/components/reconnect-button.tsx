"use client";

// import { buildLink, createEndUserAgreement } from "@midday/gocardless";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
import { useRouter } from "next/navigation";

export function ReconnectButton({ id, institutionId }) {
  const router = useRouter();

  const handleCreateEndUserAgreement = async () => {
    // const data = await createEndUserAgreement(institutionId);
    // const { link } = await buildLink({
    //   redirect: `${
    //     location.origin
    //   }/api/gocardless?id=${id}&desktop=${isDesktopApp()}`,
    //   institutionId,
    //   agreement: data.id,
    // });
    // router.push(link);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleCreateEndUserAgreement}
    >
      <Icons.Refresh size={16} />
    </Button>
  );
}
