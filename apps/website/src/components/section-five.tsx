"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import vault from "public/vault.png";
import { CtaLink } from "./cta-link";
import { ExportToast } from "./export-toast";

export function SectionFive() {
  return (
    <section className="flex justify-between space-y-12 lg:space-y-0 lg:space-x-8 flex-col lg:flex-row overflow-hidden mb-12">
      <div className="border border-border lg:basis-2/3 bg-[#121212] p-10 flex lg:space-x-8 lg:flex-row flex-col-reverse lg:items-center lg:items-start group">
        <Image
          src={vault}
          quality={90}
          alt="Vault"
          className="mt-8 lg:mt-0 basis-1/2 object-contain max-w-[70%] sm:max-w-[50%] md:max-w-[35%] border-l-[1px] border-border"
        />

        <div className="flex flex-col basis-1/2 relative h-full">
          <h4 className="font-medium text-xl md:text-2xl mb-4">Vault</h4>

          <p className="text-[#878787] mb-4 text-sm">
            Store your files securely in Midday.
          </p>

          <p className="text-[#878787] text-sm">
            There’s no need to scramble for things across different drives. Keep
            all of your files, such as contracts and agreements safe in one
            place.
          </p>

          <div className="flex flex-col space-y-2 h-full">
            <div className="flex space-x-2 items-center mt-8 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={18}
                height={13}
                fill="none"
              >
                <path
                  fill="currentColor"
                  d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
                />
              </svg>
              <span className="text-primary">
                Automatic classification of documents for easy search & find
              </span>
            </div>
            <div className="flex space-x-2 items-center text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={18}
                height={13}
                fill="none"
              >
                <path
                  fill="currentColor"
                  d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
                />
              </svg>
              <span className="text-primary">Smart search</span>
            </div>

            <div className="absolute bottom-0 left-0">
              <CtaLink text="Centralize Your Files now" />
            </div>
          </div>
        </div>
      </div>

      <div className="border border-border basis-1/3 bg-[#121212] p-10 flex flex-col group">
        <h4 className="font-medium text-xl md:text-2xl mb-4">
          Seamless export
        </h4>
        <p className="text-[#878787] text-sm mb-8">
          Take the hassle out of preparing exports for your accountant. Just
          select any time period or transaction you want and hit export. We
          package everything up neatly in a CSV file (accountants loves these)
          clearly pointing to the right attachment.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-auto"
        >
          <ExportToast />
        </motion.div>

        <div className="mt-8 hidden md:flex">
          <CtaLink text="Streamline your workflow" />
        </div>
      </div>
    </section>
  );
}
