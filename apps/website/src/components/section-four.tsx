"use client";

import { motion } from "framer-motion";
import inboxActionsLight from "public/inbox-actions-light.png";
import inboxActionsDark from "public/inbox-actions.png";
import inboxSuggestedLight from "public/inbox-suggested-light.png";
import inboxSuggestedDark from "public/inbox-suggested.png";
import invoiceCommentsLight from "public/invoice-comments-light.png";
import invoiceCommentsDark from "public/invoice-comments.png";
import invoiceToolbarLight from "public/invoice-toolbar-light.png";
import invoiceToolbarDark from "public/invoice-toolbar.png";
import invoicingLight from "public/invoicing-light.png";
import invoicingDark from "public/invoicing.png";
import { CtaLink } from "./cta-link";
import { DynamicImage } from "./dynamic-image";

export function SectionFour() {
  return (
    <section className="flex justify-between space-y-12 lg:space-y-0 lg:space-x-8 flex-col lg:flex-row overflow-hidden mb-12 relative">
      <div className="border border-border md:basis-2/3 dark:bg-[#121212] p-10 flex justify-between md:space-x-8 md:flex-row flex-col group">
        <div className="flex flex-col md:basis-1/2">
          <h4 className="font-medium text-xl md:text-2xl mb-4">Invoicing</h4>

          <p className="text-[#878787] md:mb-4 text-sm">
            Create and send invoices to your customers, monitor your sent
            balance, track overdue payments and send reminders.
          </p>

          <div className="flex flex-col space-y-2 mt-8">
            <div className="flex space-x-2 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 18 13"
                fill="none"
                className="flex-none w-[1.125rem] h-[1lh]"
              >
                <path
                  fill="currentColor"
                  d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
                />
              </svg>
              <span className="text-primary">Create Customers</span>
            </div>
            <div className="flex space-x-2 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 18 13"
                fill="none"
                className="flex-none w-[1.125rem] h-[1lh]"
              >
                <path
                  fill="currentColor"
                  d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
                />
              </svg>
              <span className="text-primary">Add Vat & Sales tax</span>
            </div>

            <div className="flex space-x-2 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 18 13"
                fill="none"
                className="flex-none w-[1.125rem] h-[1lh]"
              >
                <path
                  fill="currentColor"
                  d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
                />
              </svg>
              <span className="text-primary">Add discount</span>
            </div>

            <div className="flex space-x-2 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 18 13"
                fill="none"
                className="flex-none w-[1.125rem] h-[1lh]"
              >
                <path
                  fill="currentColor"
                  d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
                />
              </svg>
              <span className="text-primary">Add Logo</span>
            </div>

            <div className="flex space-x-2 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 18 13"
                fill="none"
                className="flex-none w-[1.125rem] h-[1lh]"
              >
                <path
                  fill="currentColor"
                  d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
                />
              </svg>
              <span className="text-primary">Send web invoices</span>
            </div>

            <div className="flex space-x-2 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 18 13"
                fill="none"
                className="flex-none w-[1.125rem] h-[1lh]"
              >
                <path
                  fill="currentColor"
                  d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
                />
              </svg>
              <span className="text-primary">Export as PDF</span>
            </div>

            <div className="flex space-x-2 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 18 13"
                fill="none"
                className="flex-none w-[1.125rem] h-[1lh]"
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
          <DynamicImage
            lightSrc={invoicingLight}
            darkSrc={invoicingDark}
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
            <DynamicImage
              lightSrc={invoiceCommentsLight}
              darkSrc={invoiceCommentsDark}
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
            <DynamicImage
              lightSrc={invoiceToolbarLight}
              darkSrc={invoiceToolbarDark}
              height={34}
              width={136}
              className="object-contain"
              quality={90}
              alt="Invoice toolbar"
            />
          </motion.div>
        </div>
      </div>

      <div className="border border-border basis-1/3 dark:bg-[#121212] p-10 flex flex-col relative group">
        <h4 className="font-medium text-xl md:text-2xl mb-4">Inbox</h4>
        <ul className="list-decimal list-inside text-[#878787] text-sm space-y-2 leading-relaxed">
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

        <div className="flex flex-col space-y-2 mb-6 mt-8">
          <div className="flex space-x-2 text-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 18 13"
              fill="none"
              className="flex-none w-[1.125rem] h-[1lh]"
            >
              <path
                fill="currentColor"
                d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
              />
            </svg>
            <span className="text-primary">Personalized email</span>
          </div>
          <div className="flex space-x-2 text-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 18 13"
              fill="none"
              className="flex-none w-[1.125rem] h-[1lh]"
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

          <div className="flex space-x-2 text-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 18 13"
              fill="none"
              className="flex-none w-[1.125rem] h-[1lh]"
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
          transition={{ duration: 0.3, delay: 1.4 }}
          viewport={{ once: true }}
          className="xl:absolute bottom-[100px]"
        >
          <DynamicImage
            lightSrc={inboxActionsLight}
            darkSrc={inboxActionsDark}
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
          transition={{ duration: 0.3, delay: 1.8 }}
          viewport={{ once: true }}
          className="xl:absolute mt-4 xl:mt-0 bottom-[140px] right-10"
        >
          <DynamicImage
            lightSrc={inboxSuggestedLight}
            darkSrc={inboxSuggestedDark}
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
