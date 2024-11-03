import { Avatar } from "./avatar";
import { Status } from "./status";

type Props = {
  customerName: string;
  status: "draft" | "overdue" | "paid" | "unpaid" | "canceled";
  logoUrl?: string;
  isValidLogo: boolean;
};

export function Header({ customerName, status, logoUrl, isValidLogo }: Props) {
  return (
    <div tw="flex mb-12 items-center justify-between w-full">
      <Avatar
        logoUrl={logoUrl}
        isValidLogo={isValidLogo}
        customerName={customerName}
      />
      <Status status={status} />
    </div>
  );
}
