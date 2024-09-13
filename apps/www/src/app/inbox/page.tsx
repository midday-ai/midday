import type { Metadata } from "next";
import Image from "next/image";
import { CopyInput } from "@/components/copy-input";
import Inbox from "public/product-inbox.jpg";
import Match from "public/product-match.png";
import Receipt from "public/product-receipt.png";

export const metadata: Metadata = {
  title: "Inbox",
};

export default function Page() {
  return (
    <div className="container mb-52">
      <div className="mb-40">
        <h1 className="text-stroke mb-2 mt-24 text-center text-[75px] font-medium leading-none md:text-[170px]">
          Magic
        </h1>

        <h3 className="mb-2 text-center text-[75px] font-medium leading-none md:text-[170px]">
          Inbox
        </h3>

        <div className="relative flex flex-col items-center text-center">
          <p className="mt-4 max-w-[600px] text-lg">
            Automatically match incoming invoices or receipts to the correct
            transaction.
          </p>
        </div>
      </div>

      <Image src={Inbox} quality={100} alt="Inbox" />

      <div className="relative mt-28 flex flex-col items-center text-center">
        <div>
          <h4 className="mb-4 text-xl font-medium md:text-2xl">
            Automatic reconciliation
          </h4>
          <p className="text-sm text-[#878787]">
            1. Use your personalized email address for your invoices and
            receipts.
            <br /> 2. When the invoice arrives in the inbox, our AI solution
            automatically matches it with the correct transaction. <br />
            3. Your transactions now have the correct attachments, making it
            easy for you to export them.
          </p>
        </div>

        <CopyInput
          value="inbox.f3f1s@solomon-ai.co"
          className="mt-8 max-w-[240px]"
        />

        <Image
          src={Match}
          quality={100}
          alt="Matching"
          className="mt-10 w-full max-w-[834px]"
        />

        <div className="mt-32 max-w-[600px]">
          <h4 className="mb-4 text-xl font-medium md:text-2xl">
            Keep track and find that old receipt
          </h4>
          <p className="mb-10 text-sm text-[#878787]">
            Have a clear picture of which receipts or invoices are missing a
            transaction and which ones are completed. Use the assistant to find
            the right receipts or invoices by searching keywords or amounts
            directly from the PDF/Photo itself.
          </p>
        </div>

        <Image
          src={Receipt}
          quality={100}
          alt="Receipt"
          className="mt-10 w-full max-w-[432px]"
        />
      </div>
    </div>
  );
}
