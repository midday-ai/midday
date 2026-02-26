"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Avatar, AvatarFallback } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import Link from "next/link";

type CaseData = NonNullable<RouterOutputs["collections"]["getById"]>;

type Props = {
  data: CaseData;
};

export function CaseMerchantInfo({ data }: Props) {
  return (
    <div className="border border-border bg-background p-4">
      <h3 className="text-sm font-medium mb-3">Merchant</h3>

      <div className="flex items-center gap-3 mb-3">
        <Avatar className="size-8">
          <AvatarFallback className="text-xs font-medium">
            {data.merchantName?.[0] || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm truncate">
            {data.merchantName || "Unknown"}
          </div>
          {data.merchantEmail && (
            <div className="text-xs text-[#878787] truncate">
              {data.merchantEmail}
            </div>
          )}
        </div>
      </div>

      {data.merchantId && (
        <Link href={`/merchants/${data.merchantId}`}>
          <Button variant="outline" size="sm" className="w-full text-xs h-7">
            <Icons.ArrowRightAlt size={14} className="mr-1" />
            View Merchant
          </Button>
        </Link>
      )}
    </div>
  );
}
