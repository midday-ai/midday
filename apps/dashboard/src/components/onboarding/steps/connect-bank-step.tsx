"use client";

import { motion } from "framer-motion";
import { Suspense, use } from "react";
import { BankSearchContent } from "@/components/bank-search-content";
import { SelectBankAccountsContent } from "@/components/select-bank-accounts-content";
import { useConnectParams } from "@/hooks/use-connect-params";

type Props = {
  onContinue: () => void;
  defaultCountryCodePromise: Promise<string>;
  onSyncStarted?: (data: { runId: string; accessToken: string }) => void;
};

export function ConnectBankStep({
  onContinue,
  defaultCountryCodePromise,
  onSyncStarted,
}: Props) {
  const countryCode = use(defaultCountryCodePromise);
  const { step: connectStep, setParams } = useConnectParams();

  const isSelectingAccounts = connectStep === "account";

  const handleComplete = () => {
    setParams(null);
    onContinue();
  };

  const handleClose = () => {
    setParams(null);
  };

  if (isSelectingAccounts) {
    return (
      <div>
        <Suspense>
          <SelectBankAccountsContent
            enabled
            onClose={handleClose}
            onComplete={handleComplete}
            onSyncStarted={onSyncStarted}
            stickySubmit={false}
            accountsListClassName="min-h-[180px]"
            fadeGradientClass="bg-gradient-to-t from-white dark:from-[#0c0c0c] to-transparent"
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-lg lg:text-xl font-serif"
      >
        Connect your bank
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="text-sm text-muted-foreground leading-relaxed"
      >
        Connect your bank account to automatically sync transactions and keep
        your finances up to date.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.3 }}
      >
        <Suspense>
          <BankSearchContent
            enabled={true}
            redirectPath="/onboarding?s=connect-bank"
            listHeight="h-[calc(100vh-570px)] max-h-[calc(100vh-570px)]"
            defaultCountryCode={countryCode}
            fadeGradientClass="bg-gradient-to-t from-white dark:from-[#0c0c0c] to-transparent"
            emptyState={({ query }) => (
              <div className="flex flex-col items-center justify-center py-16 border-b border-border">
                <p className="font-medium mb-3">No banks found</p>
                <p className="text-sm text-center text-muted-foreground leading-relaxed max-w-[280px]">
                  {query
                    ? "Try a different search term."
                    : "We don't support banks in this region yet. We're adding new banks regularly."}
                </p>
                <p className="text-xs text-center text-muted-foreground mt-4">
                  You can also import transactions via CSV from settings.
                </p>
              </div>
            )}
          />
        </Suspense>
      </motion.div>
    </div>
  );
}
