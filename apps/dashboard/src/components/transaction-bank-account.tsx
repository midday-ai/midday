import { cn } from "@midday/ui/cn";
import Image from "next/image";

type Props = {
  logoUrl?: string;
  name?: string;
  size?: number;
  className?: string;
};

export function TransactionBankAccount({
  logoUrl,
  name,
  size = 20,
  className,
}: Props) {
  return (
    <div className="flex space-x-2 mt-1 items-center">
      {logoUrl && (
        <div className="rounded-full overflow-hidden">
          <Image
            src={logoUrl}
            alt={name ?? ""}
            width={size}
            height={size}
            className="aspect-square"
            quality={100}
          />
        </div>
      )}
      <span className={cn("text-sm", className)}>{name}</span>
    </div>
  );
}
