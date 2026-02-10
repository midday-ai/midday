import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import Link from "next/link";
import { getWebsiteLogo } from "@/utils/logos";
import { InvoiceStatus } from "./invoice-status";

type Props = {
  name: string;
  website?: string | null;
  status?:
    | "overdue"
    | "paid"
    | "unpaid"
    | "draft"
    | "canceled"
    | "scheduled"
    | "refunded";
  portalEnabled?: boolean;
  portalId?: string | null;
};

export default function CustomerHeader({
  name,
  website,
  status,
  portalEnabled,
  portalId,
}: Props) {
  const customerInfo = (
    <div className="flex items-center space-x-2">
      {name && (
        <Avatar className="size-5 object-contain border border-border">
          {website && (
            <AvatarImageNext
              src={getWebsiteLogo(website)}
              alt={`${name} logo`}
              width={20}
              height={20}
              quality={100}
            />
          )}
          <AvatarFallback className="text-[9px] font-medium">
            {name?.[0]}
          </AvatarFallback>
        </Avatar>
      )}
      <span className="truncate text-sm">{name}</span>
    </div>
  );

  return (
    <div className="flex justify-between items-center mb-4">
      {portalEnabled && portalId ? (
        <Link
          href={`/p/${portalId}`}
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
        >
          {customerInfo}
        </Link>
      ) : (
        customerInfo
      )}

      <InvoiceStatus status={status} />
    </div>
  );
}
