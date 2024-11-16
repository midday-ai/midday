import { CtaLink } from "@/components/cta-link";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import type { Metadata } from "next";
import Image from "next/image";
import Invoice from "public/product-invoice.jpg";
import Pdf from "public/product-pdf.png";
import Status from "public/product-status.png";

export const metadata: Metadata = {
  title: "Invoice",
  description:
    "Create web-based invoices in seconds. Have an easy overview of all your invoices and see your outstanding balance.",
};

export default function Page() {
  return (
    <div className="container mb-52">
      <div className="mb-40">
        <div className="mt-24 text-center">
          <h1 className="mt-24 font-medium text-center text-[75px] md:text-[170px] mb-2 leading-none text-stroke">
            Seamless
          </h1>
        </div>

        <h3 className="font-medium text-center text-[75px] md:text-[170px] mb-2 leading-none">
          Invoice
        </h3>

        <div className="flex items-center flex-col text-center relative">
          <p className="text-lg mt-4 max-w-[600px]">
            Create web-based invoices in seconds. Have an easy overview of all
            your invoices and see your outstanding balance.
          </p>

          <Button
            className="mt-12 h-11 space-x-2 items-center py-2"
            variant="outline"
          >
            <span>Send your first invoice in seconds</span>
            <Icons.ArrowOutward />
          </Button>
        </div>
      </div>

      <Image src={Invoice} quality={90} alt="Invoice" />

      <div className="flex items-center flex-col text-center relative mt-28">
        <div className="max-w-[600px]">
          <h4 className="font-medium text-xl md:text-2xl mb-4">
            Fast and easy
          </h4>
          <p className="text-[#878787] text-sm">
            Create and send invoices to your customers with ease. Add essential
            details like VAT, sales tax, discounts and a personalized logo to
            make your invoices professional and tailored to your needs. You can
            send web invoices, export them as PDFs, and even track whether your
            invoices have been viewed by the recipient.
          </p>
        </div>

        <Image
          src={Pdf}
          quality={90}
          alt="Pdf"
          className="mt-10 max-w-[536px] w-full"
        />

        <div className="mt-32 max-w-[600px]">
          <h4 className="font-medium text-xl md:text-2xl mb-4">
            Track payments and stay organized
          </h4>
          <p className="text-[#878787] text-sm mb-10">
            Monitor your sent balance, stay on top of overdue payments, and send
            reminders to ensure timely settlements. With these tools, managing
            your invoicing process becomes streamlined and efficient, giving you
            more time to focus on growing your business.
          </p>
        </div>

        <Image
          src={Status}
          quality={90}
          alt="Pdf"
          className="mt-10 max-w-[736px] w-full"
        />
      </div>
    </div>
  );
}
