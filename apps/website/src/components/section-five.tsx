import Image from "next/image";
import exporting from "public/exporting.png";
import vault from "public/vault.png";

export function SectionFive() {
  return (
    <section className="flex justify-between space-y-12 lg:space-y-0 lg:space-x-8 flex-col lg:flex-row overflow-hidden mb-12">
      <div className="border border-border lg:basis-2/3 bg-[#121212] p-10 flex justify-between lg:space-x-8 lg:flex-row flex-col-reverse items-center lg:items-start">
        <Image
          src={vault}
          quality={100}
          alt="Vault"
          className="mt-8 lg:mt-0 basis-1/2 object-contain md:max-w-[367px] border-l-[1px] border-border"
        />

        <div className="flex flex-col basis-1/2">
          <h4 className="font-medium text-xl md:text-2xl mb-4">Vault</h4>

          <p className="text-[#878787] mb-4 text-sm">
            Store your files securely in Midday.
          </p>

          <p className="text-[#878787] text-sm">
            There’s no need to scramble for things across different drives. Keep
            all of your files, such as contracts and agreements safe in one
            place.
          </p>
        </div>
      </div>

      <div className="border border-border basis-1/3 bg-[#121212] p-10 md:text-center flex flex-col">
        <h4 className="font-medium text-xl md:text-2xl mb-4">
          Seamless export
        </h4>
        <p className="text-[#878787] text-sm">
          Take the hassle out of preparing exports for your accountant. Just
          select any time period or transaction you want and hit export. We
          package everything up neatly in a CSV file (accountants loves these)
          clearly pointing to the right attachment.
        </p>

        <Image
          src={exporting}
          quality={100}
          alt="Export"
          className="md:mt-auto mt-10"
        />
      </div>
    </section>
  );
}
