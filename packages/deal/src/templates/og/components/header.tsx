import { Avatar } from "./avatar";
import { Status } from "./status";

type Props = {
  merchantName: string | null;
  status:
    | "draft"
    | "overdue"
    | "paid"
    | "unpaid"
    | "canceled"
    | "scheduled"
    | "refunded";
  logoUrl?: string | null;
  isValidLogo: boolean;
};

export function Header({ merchantName, status, logoUrl, isValidLogo }: Props) {
  return (
    <div tw="flex mb-12 items-center justify-between w-full">
      <Avatar
        logoUrl={logoUrl}
        isValidLogo={isValidLogo}
        merchantName={merchantName || ""}
      />
      <Status status={status} />
    </div>
  );
}
