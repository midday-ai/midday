import { CopyInput } from "@/components/copy-input";
import { DynamicImage } from "@/components/dynamic-image";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import type { Metadata } from "next";
import BulkLight from "public/product-bulk-light.png";
import BulkDark from "public/product-bulk.png";
import InboxLight from "public/product-inbox-light.jpg";
import InboxDark from "public/product-inbox.jpg";
import MatchLight from "public/product-match-light.png";
import MatchDark from "public/product-match.png";

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
            Use your personalized email for invoices and receipts, with
            transaction suggestions from Midday. Easily search, reconcile and
            export documents to keep your business organized.
          </p>

          <Button
            className="mt-12 h-11 space-x-2 items-center py-2"
            variant="outline"
          >
            <span>Automate your reconciliation process</span>
            <Icons.ArrowOutward />
          </Button>
        </div>
      </div>

      <DynamicImage darkSrc={InboxDark} lightSrc={InboxLight} alt="Inbox" />

      <div className="flex items-center flex-col text-center relative mt-28">
        <div>
          <h4 className="font-medium text-xl md:text-2xl mb-4">
            Automatic reconciliation
          </h4>
          <p className="text-[#878787] text-sm">
            1. Use your personalized email address for your invoices and
            receipts.
            <br /> 2. The invoice arrives in the inbox, Midday gives you a
            transaction suggestion to match it with. <br />
            3. Your transactions now have the correct attachments, making it
            easy for you to export them.
          </p>
        </div>

        <CopyInput
          value="inbox.f3f1s@midday.ai"
          className="max-w-[240px] mt-8"
        />

        <DynamicImage
          darkSrc={MatchDark}
          lightSrc={MatchLight}
          alt="Matching"
          className="mt-10 max-w-[834px] w-full"
        />

        <div className="mt-32 max-w-[600px]">
          <h4 className="font-medium text-xl md:text-2xl mb-4">
            Keep track and find that old receipt
          </h4>
          <p className="text-[#878787] text-sm mb-10">
            Quickly search for specific content within your receipts and
            invoices. Bulk upload by dragging and dropping, with automatic
            storage in your vault. Keep everything organized and accessible to
            simplify receipt reconciliation.
          </p>
        </div>

        <DynamicImage
          darkSrc={BulkDark}
          lightSrc={BulkLight}
          alt="Receipt"
          className="mt-10 max-w-[1374px] w-full"
        />
      </div>
    </div>
  );
}
