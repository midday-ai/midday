import Image from "next/image";
import inbox from "public/inbox.png";
import invoicing from "public/invoicing.png";
import { CopyInput } from "./copy-input";

export function SectionFour() {
  return (
    <section className="flex justify-between space-x-8 h-[450px]">
      <div className="border basis-1/3 rounded-2xl bg-[#121212] p-10 text-center flex flex-col">
        <h4 className="font-medium text-2xl mb-4">Invoicing</h4>
        <p className="text-[#878787]">
          We’re working hard to give you the best invoice solution. It will
          feature web based invoices, live collaboration and project sync.
        </p>

        <Image
          src={invoicing}
          quality={100}
          className="mt-auto object-contain"
        />
      </div>

      <div className="border basis-2/3 rounded-2xl bg-[#121212] p-10 flex justify-between space-x-8">
        <div className="flex flex-col basis-1/2">
          <h4 className="font-medium text-2xl mb-4">Magic inbox</h4>

          <p className="text-[#878787] mb-4">
            Automatic matching of incoming invoices or receipts to the right
            transaction.
          </p>

          <ul className="list-decimal pl-4 space-y-3">
            <li className="text-[#878787]">
              Use your personalized email address for your invoices and
              receipts.
            </li>
            <li className="text-[#878787]">
              The invoice arrives in the inbox, with our AI solution the invoice
              automatically matches with the right transaction.
            </li>
            <li className="text-[#878787]">
              Your transaction now have the right basis/attachments for you to
              export.
            </li>
          </ul>

          <CopyInput
            value="inbox.fw12ed@midday.ai"
            className="max-w-[240px] mt-auto"
          />
        </div>

        <Image
          src={inbox}
          quality={100}
          className="-mb-10 basis-1/2 object-contain"
        />
      </div>
    </section>
  );
}
