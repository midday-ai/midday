import Image from "next/image";
import exporting from "public/exporting.png";
import vault from "public/vault.png";

export function SectionFive() {
  return (
    <section className="flex justify-between space-x-8 h-[450px]">
      <div className="border basis-2/3 rounded-2xl bg-[#121212] p-10 flex justify-between space-x-8">
        <Image
          src={vault}
          quality={100}
          className="-ml-10 basis-1/2 object-contain"
        />

        <div className="flex flex-col basis-1/2">
          <h4 className="font-medium text-2xl mb-4">Vault</h4>

          <p className="text-[#878787] mb-4">
            Store your files securely in Midday too.
          </p>

          <p className="text-[#878787]">
            Have everything in one place and store your contracts and agreements
            in one place. Our plan for the future is to build a contract
            solution with signing within Midday too.
          </p>
        </div>
      </div>

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
