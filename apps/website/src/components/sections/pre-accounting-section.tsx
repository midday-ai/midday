"use client";

import Image from "next/image";
import Link from "next/link";
import { MaterialIcon } from "../homepage/icon-mapping";

export function PreAccountingSection() {
  return (
    <section className="bg-background py-12 sm:py-16 lg:py-24">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center space-y-4 mb-12">
          <div className="h-[100px] w-28 mx-auto mb-8 relative">
            <Image
              src="/images/accounting-light.png"
              alt="Accounting Icon"
              width={112}
              height={100}
              className="w-full h-full object-contain rounded-none dark:hidden"
            />
            <Image
              src="/images/accounting-dark.png"
              alt="Accounting Icon"
              width={112}
              height={100}
              className="w-full h-full object-contain rounded-none hidden dark:block"
            />
          </div>
          <h2 className="font-serif text-2xl sm:text-2xl text-foreground">
            Ready for accounting, without extra work
          </h2>
          <p className="hidden sm:block font-sans text-base text-muted-foreground leading-normal max-w-2xl mx-auto">
            Receipts, invoices, and transactions stay organized automatically so
            your books are always ready when you need them.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Link
            href="/pre-accounting"
            className="block cursor-pointer hover:opacity-90 transition-opacity"
          >
            <div className="bg-secondary border border-border p-6 relative">
              <div className="space-y-6">
                {/* Section 1 */}
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                    <MaterialIcon
                      name="check"
                      className="text-foreground"
                      size={14}
                    />
                  </div>
                  <span className="font-sans text-sm text-foreground">
                    <span className="sm:hidden">
                      Transactions from 25,000+ banks
                    </span>
                    <span className="hidden sm:inline">
                      Transactions from 25,000+ banks are categorized and
                      reconciled automatically
                    </span>
                  </span>
                </div>

                {/* Section 2 */}
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                    <MaterialIcon
                      name="check"
                      className="text-foreground"
                      size={14}
                    />
                  </div>
                  <span className="font-sans text-sm text-foreground">
                    <span className="sm:hidden">
                      Receipts pulled from email and uploads
                    </span>
                    <span className="hidden sm:inline">
                      Receipts and invoices are pulled from email and payments,
                      then matched to transactions
                    </span>
                  </span>
                </div>

                {/* Section 3 */}
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                    <MaterialIcon
                      name="check"
                      className="text-foreground"
                      size={14}
                    />
                  </div>
                  <span className="font-sans text-sm text-foreground">
                    Clean records across all connected accounts
                  </span>
                </div>

                {/* Section 4 */}
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                    <MaterialIcon
                      name="check"
                      className="text-foreground"
                      size={14}
                    />
                  </div>
                  <span className="font-sans text-sm text-foreground">
                    <span className="sm:hidden">
                      Taxes tracked per transaction
                    </span>
                    <span className="hidden sm:inline">
                      Taxes are tracked per transaction
                    </span>
                  </span>
                </div>

                {/* Section 5 */}
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                    <MaterialIcon
                      name="check"
                      className="text-foreground"
                      size={14}
                    />
                  </div>
                  <span className="font-sans text-sm text-foreground">
                    <span className="sm:hidden">
                      Ready to export to your accounting system
                    </span>
                    <span className="hidden sm:inline">
                      Export-ready for your accounting system
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
        <div className="text-center mt-8">
          <Link
            href="/pre-accounting"
            className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
          >
            Learn more about pre-accounting
          </Link>
        </div>
      </div>
    </section>
  );
}
