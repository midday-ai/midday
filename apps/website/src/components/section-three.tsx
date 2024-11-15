"use client";

import { CtaLink } from "@/components/cta-link";
import { motion } from "framer-motion";
import Image from "next/image";
import breakdown from "public/breakdown.png";
import timeFormat from "public/time-format.png";
import timetracker from "public/time-tracker.png";

export function SectionThree() {
  return (
    <section className="relative mb-12 group">
      <div className="border border-border container bg-[#121212] p-8 md:p-10 md:pb-0 overflow-hidden">
        <div className="flex flex-col md:space-x-12 md:flex-row">
          <div className="xl:mt-6 md:max-w-[40%] md:mr-8 md:mb-8">
            <h3 className="font-medium text-xl md:text-2xl mb-4">
              Time track your projects
            </h3>

            <p className="text-[#878787] md:mb-4 text-sm">
              Track your time, monitor project durations, set rates and create{" "}
              <br />
              invoices from your recorded hours.
            </p>

            <div className="flex flex-col space-y-2">
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
                  Get a monthly overview of tracked hours
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
                <span className="text-primary">
                  Set billable rate & time estimates
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
                <span className="text-primary">
                  See billable amount & monthly breakdown
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
                <span className="text-primary">
                  Create invoice based on recorded time
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
                <span className="text-primary">Export as CSV</span>
              </div>
            </div>

            <div className="absolute bottom-6">
              <CtaLink text="Start tracking time now" />
            </div>
          </div>

          <div className="relative mt-8 md:mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.7 }}
              viewport={{ once: true }}
              className="absolute -left-[80px] top-[200px]"
            >
              <Image
                src={timeFormat}
                height={142}
                width={135}
                className="object-contain"
                quality={90}
                alt="Time format"
              />
            </motion.div>

            <div className="scale-75 md:scale-100">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 1.2 }}
                viewport={{ once: true }}
                className="absolute -right-[65px] md:-right-[15px] md:-top-[20px]"
              >
                <Image
                  src={breakdown}
                  height={124}
                  width={238}
                  className="object-contain"
                  quality={90}
                  alt="Breakdown"
                />
              </motion.div>
            </div>
            <Image
              src={timetracker}
              height={400}
              className="-mb-[32px] md:-mb-[1px] object-contain mt-8 md:mt-0"
              quality={90}
              alt="Tracker"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
