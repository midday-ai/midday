import type { Metadata } from "next";
import Image from "next/image";
import { Assistant } from "@/components/assistant";
import Files from "public/product-files.png";
import Vault from "public/product-vault.jpg";

export const metadata: Metadata = {
  title: "Vault",
};

export default function Page() {
  return (
    <div className="container mb-52">
      <div className="mb-40">
        <h1 className="text-stroke mb-2 mt-24 text-center text-[75px] font-medium leading-none md:text-[170px]">
          Your Files
        </h1>

        <h3 className="mb-2 text-center text-[75px] font-medium leading-none md:text-[170px]">
          Vault
        </h3>

        <div className="relative flex flex-col items-center text-center">
          <p className="mt-4 max-w-[600px] text-lg">
            Don’t waste time searching through old emails and random folders.
            Keep all your contracts, agreements and more safe in one place.
          </p>
        </div>
      </div>

      <Image src={Vault} quality={100} alt="Vault" />

      <div className="relative mt-28 flex flex-col items-center text-center">
        <div className="max-w-[600px]">
          <h4 className="mb-4 text-xl font-medium md:text-2xl">
            All your files in one place
          </h4>
          <p className="text-sm text-[#878787]">
            Gather all your business files you have laying around and have them
            in one place. Upload quickly and be able to share them with whomever
            you want.
          </p>
        </div>

        <Image
          src={Files}
          quality={100}
          alt="Files"
          className="mt-10 w-full max-w-[834px]"
        />

        <div className="mt-32 max-w-[550px]">
          <h4 className="mb-4 text-xl font-medium md:text-2xl">
            Use assistant to search
          </h4>
          <p className="mb-10 text-sm text-[#878787]">
            Use the assistant to search for your files or even within your
            files. Say you want to find that old contract but can’t remember
            which client it was for, just search for details around it and the
            assistant will find it for you.
          </p>
        </div>

        <div className="-mt-20 scale-[0.45] text-left md:mt-0 md:scale-100">
          <Assistant />
        </div>
      </div>
    </div>
  );
}
