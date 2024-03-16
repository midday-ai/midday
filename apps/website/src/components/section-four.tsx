import Image from "next/image";
import inbox from "public/inbox.png";
import invoicing from "public/invoicing.png";

export function SectionFour() {
  return (
    <section className="flex justify-between space-x-8 h-[450px]">
      <div className="border basis-1/3 rounded-2xl bg-[#121212] p-10 text-center flex flex-col">
        <h4 className="font-medium text-2xl mb-4">Invoicing</h4>
        <p className="text-[#B6B6B5]">
          We’re working hard to give you the best invoice solution. It will
          feature web based invoices, live collaboration and project sync.
        </p>

        <Image src={invoicing} quality={100} className="mt-auto" />
      </div>

      <div className="border basis-2/3 rounded-2xl bg-[#121212] p-10 flex justify-between">
        <div>
          <h4 className="font-medium text-2xl mb-4">Magic inbox</h4>

          <p className="text-[#B6B6B5]">
            Automatic matching of incoming invoices or receipts to the right
            transaction. Use your personalized email address for your invoices
            and receipts. The invoice arrives in the inbox, with our AI solution
            the invoice automatically matches with the right transaction. Your
            transaction now have the right basis/attachments for you to export.
          </p>
        </div>

        <Image src={inbox} quality={100} className="-mb-10" />
      </div>
    </section>
  );
}
