"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import exporting from "public/exporting.png";
import vault from "public/vault.png";
import { useState } from "react";

export function SectionFive() {
  const [isActive, setActive] = useState(false);
  const [isActive2, setActive2] = useState(false);

  return (
    <section className="flex justify-between space-y-12 lg:space-y-0 lg:space-x-8 flex-col lg:flex-row overflow-hidden mb-12">
      <div
        className="border border-border lg:basis-2/3 bg-[#121212] p-10 flex justify-between lg:space-x-8 lg:flex-row flex-col-reverse items-center lg:items-start"
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
      >
        <motion.div
          animate={isActive ? { y: -5, x: 5 } : { y: 0, x: 0 }}
          initial={{ y: 0, x: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <Image
            src={vault}
            quality={100}
            alt="Vault"
            className="mt-8 lg:mt-0 basis-1/2 object-contain md:max-w-[367px]"
          />
        </motion.div>

        <div className="flex flex-col basis-1/2">
          <h4 className="font-medium text-xl md:text-2xl mb-4">Vault</h4>

          <p className="text-[#878787] mb-4">
            Store your files securely in Midday.
          </p>

          <p className="text-[#878787]">
            There’s no need to scramble for things across different drives. Keep
            all of your files, such as contracts and agreements safe in one
            place.
          </p>
        </div>
      </div>

      <div
        className="border border-border basis-1/3 bg-[#121212] p-10 md:text-center flex flex-col"
        onMouseEnter={() => setActive2(true)}
        onMouseLeave={() => setActive2(false)}
      >
        <h4 className="font-medium text-xl md:text-2xl mb-4">
          Seamless export
        </h4>
        <p className="text-[#878787]">
          Take the hassle out of preparing exports for your accountant. Just
          select any time period or transaction you want and hit export. We
          package everything up neatly in a CSV file (accountants loves these)
          clearly pointing to the right attachment.
        </p>

        <motion.div
          animate={isActive2 ? { y: -5, x: -5 } : { y: 0, x: 0 }}
          initial={{ y: -5, x: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="mt-8 lg:mt-auto"
        >
          <Image src={exporting} quality={100} alt="Export" />
        </motion.div>
      </div>
    </section>
  );
}
