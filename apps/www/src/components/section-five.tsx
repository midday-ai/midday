import Image from "next/image";
import exporting from "public/exporting.png";
import vault from "public/vault.png";

export function SectionFive() {
  return (
    <section className="mb-12 flex flex-col justify-between space-y-12 overflow-hidden lg:flex-row lg:space-x-8 lg:space-y-0">
      <div className="flex flex-col-reverse items-center justify-between border border-border bg-[#121212] p-10 lg:basis-2/3 lg:flex-row lg:items-start lg:space-x-8">
        <Image
          src={vault}
          quality={100}
          alt="Vault"
          className="mt-8 basis-1/2 border-l-[1px] border-border object-contain md:max-w-[367px] lg:mt-0"
        />

        <div className="flex basis-1/2 flex-col">
          <h4 className="mb-4 text-xl font-medium md:text-2xl">Vault</h4>

          <p className="mb-4 text-sm text-[#878787]">
            Store your files securely in Solomon AI.
          </p>

          <p className="text-sm text-[#878787]">
            There’s no need to scramble for things across different drives. Keep
            all of your files, such as contracts and agreements safe in one
            place.
          </p>
        </div>
      </div>

      <div className="flex basis-1/3 flex-col border border-border bg-[#121212] p-10 md:text-center">
        <h4 className="mb-4 text-xl font-medium md:text-2xl">
          Seamless export
        </h4>
        <p className="text-sm text-[#878787]">
          Take the hassle out of preparing exports for your accountant. Just
          select any time period or transaction you want and hit export. We
          package everything up neatly in a CSV file (accountants loves these)
          clearly pointing to the right attachment.
        </p>

        <Image
          src={exporting}
          quality={100}
          alt="Export"
          className="mt-10 md:mt-auto"
        />
      </div>
    </section>
  );
}
