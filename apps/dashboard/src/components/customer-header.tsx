import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { InvoiceStatus } from "./invoice-status";

type Props = {
  name: string;
  website: string;
  status: "overdue" | "paid" | "unpaid" | "draft" | "canceled";
};

export default function CustomerHeader({ name, website, status }: Props) {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center space-x-2">
        {name && (
          <Avatar className="size-5 object-contain border border-border">
            {website && (
              <AvatarImageNext
                src={`https://img.logo.dev/${website}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ&size=60`}
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

      <InvoiceStatus status={status} />
    </div>
  );
}
