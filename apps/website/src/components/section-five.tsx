import { AdaptiveImage } from "@/components/adaptive-image";
import exportingLight from "public/exporting-light.png";
import exporting from "public/exporting.png";
import vaultLight from "public/vault-light.png";
import vault from "public/vault.png";

export function SectionFive() {
  return (
    <section className="flex justify-between space-y-12 md:space-y-0 md:space-x-8 md:h-[450px] flex-col md:flex-row">
      <div className="border border-border md:basis-2/3 rounded-2xl bg-white dark:bg-[#121212] p-10 flex justify-between md:space-x-8 md:flex-row flex-col-reverse items-center md:items-start">
        <AdaptiveImage
          darkSrc={vault}
          lightSrc={vaultLight}
          quality={100}
          className="mt-8 md:mt-0 basis-1/2 object-contain md:max-w-[367px]"
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

      <div className="border border-border basis-1/3 rounded-2xl bg-white dark:bg-[#121212] p-10 md:text-center flex flex-col">
        <h4 className="font-medium text-2xl mb-4">Seamless export</h4>
        <p className="text-[#878787]">
          Export your transaction with their attachments/basis and hand over to
          you accountant. You can select whatever timeperiod or seperate
          transaction you want.
        </p>

        <AdaptiveImage
          darkSrc={exporting}
          lightSrc={exportingLight}
          quality={100}
          className="mt-8 md:mt-auto"
        />
      </div>
    </section>
  );
}
