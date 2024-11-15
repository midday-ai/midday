"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import inboxActions from "public/inbox-actions.png";
import inboxSuggested from "public/inbox-suggested.png";
import invoiceComments from "public/invoice-comments.png";
import invoiceToolbar from "public/invoice-toolbar.png";
import invoicing from "public/invoicing.png";
import { CtaLink } from "./cta-link";

export function SectionFour() {
  return (
    <section className="flex justify-between space-y-12 lg:space-y-0 lg:space-x-8 flex-col lg:flex-row overflow-hidden mb-12 relative">
      <div className="border border-border md:basis-2/3 bg-[#121212] p-10 flex justify-between md:space-x-8 md:flex-row flex-col group">
        <div className="flex flex-col md:basis-1/2">
          <h4 className="font-medium text-xl md:text-2xl mb-4">Invoicing</h4>

          <p className="text-[#878787] md:mb-4 text-sm">
            Create and send invoices to your customers, monitor your sent
            balance, track overdue payments and send reminders.
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
              <span className="text-primary">Create Customers</span>
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
              <span className="text-primary">Add Vat & Sales tax</span>
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
              <span className="text-primary">Add discount</span>
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
              <span className="text-primary">Add Logo</span>
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
              <span className="text-primary">Send web invoices</span>
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
              <span className="text-primary">Export as PDF</span>
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
              <span className="text-primary">See if invoice is viewed</span>
            </div>

            <div className="absolute bottom-6">
              <CtaLink text="Send your first invoice in seconds" />
            </div>
          </div>
        </div>

        <div className="md:basis-1/2 md:mt-8 md:mt-0 -ml-[40px] md:-ml-0 -bottom-[8px] relative">
          <Image
            src={invoicing}
            width={299}
            height={423}
            quality={90}
            className="object-contain -bottom-[33px] relative ml-[10%] xl:ml-[20%]"
            alt="Invoicing"
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
            viewport={{ once: true }}
            className="absolute left-4 md:-left-[80px] bottom-[35px]"
          >
            <Image
              src={invoiceComments}
              height={57}
              width={327}
              className="object-contain"
              quality={90}
              alt="Invoice comments"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 1.5 }}
            viewport={{ once: true }}
            className="absolute left-8 bottom-[100px]"
          >
            <Image
              src={invoiceToolbar}
              height={34}
              width={136}
              className="object-contain"
              quality={90}
              alt="Invoice toolbar"
            />
          </motion.div>
        </div>
      </div>

      <div className="border border-border basis-1/3 bg-[#121212] p-10 flex flex-col relative group">
        <h4 className="font-medium text-xl md:text-2xl mb-4">Inbox</h4>
        <ul className="list-decimal list-inside text-[#878787] text-sm space-y-2 leading-relaxed mb-8 xl:mb-0">
          <li>
            Use your personalized email address for your invoices and receipts.
          </li>
          <li>
            The invoice arrives in the inbox, Midday gives you a transaction
            suggestion to match it with.
          </li>
          <li>
            Your transaction now have the right basis/attachments for you to
            export.
          </li>
        </ul>

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
            <span className="text-primary">Personlized email</span>
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
              Smart search receipts and invoices content
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
              Automatically saves invoices and receipt in your vault
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 1.8 }}
          viewport={{ once: true }}
          className="xl:absolute bottom-[100px]"
        >
          <Image
            src={inboxActions}
            height={33}
            width={384}
            className="object-contain scale-[0.9] 2x:scale-100"
            quality={90}
            alt="Inbox actions"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 2.1 }}
          viewport={{ once: true }}
          className="xl:absolute mt-4 xl:mt-0 bottom-[140px] right-10"
        >
          <Image
            src={inboxSuggested}
            height={19}
            width={106}
            className="object-contain"
            quality={90}
            alt="Inbox suggested"
          />
        </motion.div>

        <div className="absolute bottom-6">
          <CtaLink text="Automate your reconciliation process" />
        </div>
      </div>
    </section>
  );
}
