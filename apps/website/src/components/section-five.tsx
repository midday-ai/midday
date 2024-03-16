import Image from "next/image";
import exporting from "public/exporting.png";

export function SectionFive() {
  return (
    <section className="flex justify-between space-x-8 h-[450px]">
      <div className="border basis-2/3 rounded-2xl bg-[#121212] p-10">one</div>

      <div className="border basis-1/3 rounded-2xl bg-[#121212] p-10 text-center flex flex-col">
        <h4 className="font-medium text-2xl mb-4">Seamless export</h4>
        <p className="text-[#878787]">
          Export your transaction with their attachments/basis and hand over to
          you accountant. You can select whatever timeperiod or seperate
          transaction you want.
        </p>

        <Image src={exporting} quality={100} className="mt-auto" />
      </div>
    </section>
  );
}
