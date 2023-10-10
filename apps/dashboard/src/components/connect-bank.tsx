import { Button } from "@midday/ui/button";
import Image from "next/image";
import banks_SE from "public/banks_SE.png";

export function ConnectBank() {
  return (
    <div className="p-8 border max-w-[900px] rounded-2xl flex items-between">
      <div className="flex-1 relative">
        <h2 className="mb-2">Connect bank account</h2>
        <p className="text-sm text-[#B0B0B0]">
          We need a connection to your bank to get your transactions and
          balance.
        </p>
        <Button className="absolute bottom-0">Connnect</Button>
      </div>
      <Image src={banks_SE} width={150} height={146} alt="Banks" />
    </div>
  );
}
