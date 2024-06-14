import type { Metadata } from "next";
import Image from "next/image";
import Invoice from "public/product-invoice.jpg";

export const metadata: Metadata = {
  title: "Invoice",
};

export default function Page() {
  return (
    <div className="container">
      <div className="mb-40">
        <h1 className="mt-24 font-medium text-center text-[100px] md:text-[170px] mb-2 leading-none text-stroke">
          Seamless
        </h1>

        <h3 className="font-medium text-center text-[100px] md:text-[170px] mb-2 leading-none">
          Invoice
        </h3>

        <div className="flex items-center flex-col text-center relative">
          <p className="text-lg mt-4 max-w-[600px]">
            Create web-based invoices in seconds. Have an easy overview of all
            your invoices and see your outstanding balance.
          </p>
        </div>
      </div>

      <Image src={Invoice} quality={100} alt="Invoice" />
    </div>
  );
}
