import Image from "next/image";

export function TransactionBankAccount({ logoUrl, name, size }) {
  return (
    <div className="flex space-x-2 mt-1 items-center">
      <div className="rounded-full overflow-hidden">
        <Image src={logoUrl} alt={name} width={size} height={size} />
      </div>
      <span className="text-sm">{name}</span>
    </div>
  );
}
