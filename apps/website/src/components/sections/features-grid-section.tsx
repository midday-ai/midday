"use client";

import Link from "next/link";
import { MaterialIcon } from "../homepage/icon-mapping";

export function FeaturesGridSection() {
  return (
    <section className="bg-background py-12 sm:py-16 lg:py-24">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center space-y-4 mb-10 sm:mb-12">
          <h2 className="font-serif text-2xl sm:text-2xl text-foreground">
            Everything you need to run your business finances
          </h2>
          <p className="hidden sm:block font-sans text-base text-muted-foreground leading-normal max-w-2xl mx-auto px-4">
            Dashboards, insights, transactions, invoicing, time tracking, and
            files all connected in one system.
          </p>
        </div>

        <div className="flex flex-col gap-8 sm:gap-10 max-w-sm sm:max-w-none mx-auto">
          <div className="grid grid-cols-2 gap-6 sm:flex sm:justify-center sm:gap-20">
            <Link
              href="/assistant"
              className="flex flex-col items-center w-full sm:w-[150px] touch-manipulation"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <div className="bg-secondary border border-border w-[60px] h-[60px] flex items-center justify-center rounded-none mb-4 hover:border-muted-foreground transition-all duration-200">
                <MaterialIcon
                  name="widgets"
                  className="text-muted-foreground "
                  size={24}
                />
              </div>
              <div className="flex flex-col items-center text-center">
                <h3 className="font-sans text-sm text-foreground leading-[21px]">
                  Assistant
                </h3>
                <p className="font-sans text-sm text-muted-foreground leading-[21px]">
                  Financial answers
                </p>
              </div>
            </Link>

            <Link
              href="/insights"
              className="flex flex-col items-center w-full sm:w-[150px]"
            >
              <div className="bg-secondary border border-border w-[60px] h-[60px] flex items-center justify-center rounded-none mb-4 hover:border-muted-foreground transition-all duration-200">
                <MaterialIcon
                  name="trending_up"
                  className="text-muted-foreground "
                  size={24}
                />
              </div>
              <div className="flex flex-col items-center text-center">
                <h3 className="font-sans text-sm text-foreground leading-[21px]">
                  Insights
                </h3>
                <p className="font-sans text-sm text-muted-foreground leading-[21px]">
                  Weekly updates
                </p>
              </div>
            </Link>

            <Link
              href="/transactions"
              className="flex flex-col items-center w-full sm:w-[150px]"
            >
              <div className="bg-secondary border border-border w-[60px] h-[60px] flex items-center justify-center rounded-none mb-4 hover:border-muted-foreground transition-all duration-200">
                <MaterialIcon
                  name="list_alt"
                  className="text-muted-foreground "
                  size={24}
                />
              </div>
              <div className="flex flex-col items-center text-center">
                <h3 className="font-sans text-sm text-foreground leading-[21px]">
                  Transactions
                </h3>
                <p className="font-sans text-sm text-muted-foreground leading-[21px]">
                  Money movement
                </p>
              </div>
            </Link>

            <Link
              href="/inbox"
              className="flex flex-col items-center w-full sm:w-[150px]"
            >
              <div className="bg-secondary border border-border w-[60px] h-[60px] flex items-center justify-center rounded-none mb-4 hover:border-muted-foreground transition-all duration-200">
                <MaterialIcon
                  name="inbox"
                  className="text-muted-foreground "
                  size={24}
                />
              </div>
              <div className="flex flex-col items-center text-center">
                <h3 className="font-sans text-sm text-foreground leading-[21px]">
                  Inbox
                </h3>
                <p className="font-sans text-sm text-muted-foreground leading-[21px]">
                  Receipt matching
                </p>
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:flex sm:justify-center sm:gap-20">
            <Link
              href="/time-tracking"
              className="flex flex-col items-center w-full sm:w-[150px]"
            >
              <div className="bg-secondary border border-border w-[60px] h-[60px] flex items-center justify-center rounded-none mb-4 hover:border-muted-foreground transition-all duration-200">
                <MaterialIcon
                  name="timer"
                  className="text-muted-foreground "
                  size={24}
                />
              </div>
              <div className="flex flex-col items-center text-center">
                <h3 className="font-sans text-sm text-foreground leading-[21px]">
                  Time tracking
                </h3>
                <p className="font-sans text-sm text-muted-foreground leading-[21px]">
                  Project hours
                </p>
              </div>
            </Link>

            <Link
              href="/invoicing"
              className="flex flex-col items-center w-full sm:w-[150px]"
            >
              <div className="bg-secondary border border-border w-[60px] h-[60px] flex items-center justify-center rounded-none mb-4 hover:border-muted-foreground transition-all duration-200">
                <MaterialIcon
                  name="description"
                  className="text-muted-foreground "
                  size={24}
                />
              </div>
              <div className="flex flex-col items-center text-center">
                <h3 className="font-sans text-sm text-foreground leading-[21px]">
                  Invoicing
                </h3>
                <p className="font-sans text-sm text-muted-foreground leading-[21px]">
                  Invoice management
                </p>
              </div>
            </Link>

            <Link
              href="/customers"
              className="flex flex-col items-center w-full sm:w-[150px]"
            >
              <div className="bg-secondary border border-border w-[60px] h-[60px] flex items-center justify-center rounded-none mb-4 hover:border-muted-foreground transition-all duration-200">
                <MaterialIcon
                  name="scatter_plot"
                  className="text-muted-foreground "
                  size={24}
                />
              </div>
              <div className="flex flex-col items-center text-center">
                <h3 className="font-sans text-sm text-foreground leading-[21px]">
                  Customers
                </h3>
                <p className="font-sans text-sm text-muted-foreground leading-[21px]">
                  Customer performance
                </p>
              </div>
            </Link>

            <Link
              href="/file-storage"
              className="flex flex-col items-center w-full sm:w-[150px]"
            >
              <div className="bg-secondary border border-border w-[60px] h-[60px] flex items-center justify-center rounded-none mb-4 hover:border-muted-foreground transition-all duration-200">
                <MaterialIcon
                  name="folder_zip"
                  className="text-muted-foreground "
                  size={24}
                />
              </div>
              <div className="flex flex-col items-center text-center">
                <h3 className="font-sans text-sm text-foreground leading-[21px]">
                  Files
                </h3>
                <p className="font-sans text-sm text-muted-foreground leading-[21px]">
                  Document storage
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
