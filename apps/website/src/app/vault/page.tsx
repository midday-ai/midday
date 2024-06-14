import type { Metadata } from "next";
import Image from "next/image";
import Vault from "public/product-vault.jpg";

export const metadata: Metadata = {
  title: "Vault",
};

export default function Page() {
  return (
    <div className="container">
      <div className="mb-40">
        <h1 className="mt-24 font-medium text-center text-[100px] md:text-[170px] mb-2 leading-none text-stroke">
          Your Files
        </h1>

        <h3 className="font-medium text-center text-[100px] md:text-[170px] mb-2 leading-none">
          Vault
        </h3>

        <div className="flex items-center flex-col text-center relative">
          <p className="text-lg mt-4 max-w-[600px]">
            Don’t waste time searching through old emails and random folders.
            Keep all your contracts, agreements and more safe in one place.
          </p>
        </div>
      </div>

      <Image src={Vault} quality={100} alt="Vault" />
    </div>
  );
}
