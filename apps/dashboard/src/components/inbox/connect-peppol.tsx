"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";

export function ConnectPeppol() {
  const trpc = useTRPC();
  const router = useRouter();

  const { data: registration } = useQuery(
    trpc.team.eInvoiceRegistration.queryOptions(),
  );

  const isRegistered = registration?.status === "registered";

  return (
    <Button
      className="px-6 py-4 w-full font-medium h-[40px]"
      variant="outline"
      onClick={() => router.push("/settings/company#e-invoicing")}
    >
      <div className="flex items-center space-x-2">
        <Icons.Peppol className="size-5" />
        <span>
          {isRegistered ? "Peppol Active" : "Set up Peppol E-Invoicing"}
        </span>
      </div>
    </Button>
  );
}
