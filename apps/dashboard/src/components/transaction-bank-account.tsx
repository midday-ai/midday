import { cn } from "@midday/ui/utils";
import Image from "next/image";

export function TransactionBankAccount({
  logoUrl,
  name,
  size = 20,
  className,
}) {
  return (
    <div className="flex space-x-2 mt-1 items-center">
      {logoUrl && (
        <div className="rounded-full overflow-hidden">
          <Image src={logoUrl} alt={name} width={size} height={size} />
        </div>
      )}
      <span className={cn("text-sm", className)}>{name}</span>
    </div>
  );
}
