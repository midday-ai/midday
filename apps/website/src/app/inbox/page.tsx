import type { Metadata } from "next";
import Image from "next/image";
import Inbox from "public/product-inbox.jpg";

export const metadata: Metadata = {
  title: "Inbox",
};

export default function Page() {
  return (
    <div className="container">
      <div className="mb-40">
        <h1 className="mt-24 font-medium text-center text-[100px] md:text-[170px] mb-2 leading-none text-stroke">
          Magic
        </h1>

        <h3 className="font-medium text-center text-[100px] md:text-[170px] mb-2 leading-none">
          Inbox
        </h3>

        <div className="flex items-center flex-col text-center relative">
          <p className="text-lg mt-4 max-w-[600px]">
            Automatically match incoming invoices or receipts to the correct
            transaction.
          </p>
        </div>
      </div>

      <Image src={Inbox} quality={100} alt="Inbox" />
    </div>
  );
}
