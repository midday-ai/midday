import { CopyInput } from "@/components/copy-input";
import type { Metadata } from "next";
import Image from "next/image";
import Inbox from "public/product-inbox.jpg";
import Match from "public/product-match.png";
import Receipt from "public/product-receipt.png";

export const metadata: Metadata = {
  title: "Inbox",
  description:
    "Automatically match incoming invoices or receipts to the correct transaction.",
};

export default function Page() {
  return (
    <div className="container mb-52">
      <div className="mb-40">
        <h1 className="mt-24 font-medium text-center text-[75px] md:text-[170px] mb-2 leading-none text-stroke">
          Magic
        </h1>

        <h3 className="font-medium text-center text-[75px] md:text-[170px] mb-2 leading-none">
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

      <div className="flex items-center flex-col text-center relative mt-28">
        <div>
          <h4 className="font-medium text-xl md:text-2xl mb-4">
            Automatic reconciliation
          </h4>
          <p className="text-[#878787] text-sm">
            1. Use your personalized email address for your invoices and
            receipts.
            <br /> 2. When the invoice arrives in the inbox, our AI solution
            automatically matches it with the correct transaction. <br />
            3. Your transactions now have the correct attachments, making it
            easy for you to export them.
          </p>
        </div>

        <CopyInput
          value="inbox.f3f1s@midday.ai"
          className="max-w-[240px] mt-8"
        />

        <Image
          src={Match}
          quality={100}
          alt="Matching"
          className="mt-10 max-w-[834px] w-full"
        />

        <div className="mt-32 max-w-[600px]">
          <h4 className="font-medium text-xl md:text-2xl mb-4">
            Keep track and find that old receipt
          </h4>
          <p className="text-[#878787] text-sm mb-10">
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
          className="mt-10 max-w-[432px] w-full"
        />
      </div>
    </div>
  );
}
