"use client";

import { AdaptiveImage } from "@/components/adaptive-image";
import { motion } from "framer-motion";
import profitLossLight from "public/profit-loss-light.png";
import profitLoss from "public/profit-loss.png";
import { useState } from "react";

export function SectionTwo() {
  const [isActive, setActive] = useState(false);

  return (
    <section
      className="border border-border rounded-2xl container bg-white dark:bg-[#121212] p-6 md:p-10 md:pb-0 overflow-hidden"
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
    >
      <div className="flex flex-col md:space-x-12 md:flex-row">
        <motion.div
          animate={isActive ? { y: -5, x: 5 } : { y: 0, x: 0 }}
          initial={{ y: 0, x: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <AdaptiveImage
            lightSrc={profitLossLight}
            darkSrc={profitLoss}
            height={400}
            className="-mb-[1px] object-contain "
          />
        </motion.div>

        <div className="mt-6">
          <h3 className="font-medium text-2xl	mb-4">Financial overview</h3>

          <p className="text-[#878787] mb-4">
            Bring your own bank, we connect to over 4000 banks <br /> world
            wide.
          </p>

          <p className="text-[#878787]">
            Keep track of your expenses and income. Get a better <br />
            overview of your bussiness financial track record and
            <br /> situation. Share profit/loss reports
          </p>

          <div className="flex space-x-2 items-center mt-8">
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
            <span className="text-[#878787]">Share profit/loss reports</span>
          </div>
        </div>
      </div>
    </section>
  );
}
