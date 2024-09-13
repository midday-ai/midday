import type { Metadata } from "next";
import Image from "next/image";
import Clients from "public/product-clients.png";
import Invoice from "public/product-invoice.jpg";
import Pdf from "public/product-pdf.png";

export const metadata: Metadata = {
  title: "Invoice",
};

export default function Page() {
  return (
    <div className="container mb-52">
      <div className="mb-40">
        <div className="mt-24 text-center">
          <span className="mb-4 rounded-full border border-border bg-[#1D1D1D] px-3 py-1.5 font-mono text-xs font-medium text-[#F5F5F3]">
            Coming soon
          </span>

          <h1 className="text-stroke mb-2 mt-24 text-center text-[75px] font-medium leading-none md:text-[170px]">
            Seamless
          </h1>
        </div>

        <h3 className="mb-2 text-center text-[75px] font-medium leading-none md:text-[170px]">
          Invoice
        </h3>

        <div className="relative flex flex-col items-center text-center">
          <p className="mt-4 max-w-[600px] text-lg">
            Create web-based invoices in seconds. Have an easy overview of all
            your invoices and see your outstanding balance.
          </p>
        </div>
      </div>

      <Image src={Invoice} quality={100} alt="Invoice" />

      <div className="relative mt-28 flex flex-col items-center text-center">
        <div className="max-w-[600px]">
          <h4 className="mb-4 text-xl font-medium md:text-2xl">
            Fast and easy
          </h4>
          <p className="text-sm text-[#878787]">
            Create web-based invoices quickly, save client information, and make
            it even faster the next time. Create tailored invoices with payment
            terms, tax rules, and discounts. Simply paste in how you want to be
            paid and send it.
          </p>
        </div>

        <Image
          src={Clients}
          quality={100}
          alt="Clients"
          className="mt-10 w-full max-w-[834px]"
        />

        <div className="mt-32 max-w-[600px]">
          <h4 className="mb-4 text-xl font-medium md:text-2xl">No more PDFs</h4>
          <p className="mb-10 text-sm text-[#878787]">
            Easily change your invoices on the fly instead of sending an
            uneditable PDF. Share the link with your client and get paid.
          </p>
        </div>

        <Image
          src={Pdf}
          quality={100}
          alt="Pdf"
          className="mt-10 w-full max-w-[536px]"
        />
      </div>
    </div>
  );
}
