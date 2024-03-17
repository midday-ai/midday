"use client";

import { createEndUserAgreementAction } from "@/actions/banks/create-end-user-agreement-action";
import { getBanks } from "@/actions/banks/get-banks";
import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { Skeleton } from "@midday/ui/skeleton";
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Image from "next/image";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { CountrySelector } from "../country-selector";

function RowsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-3.5 w-[130px]" />
      </div>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-3.5 w-[180px]" />
      </div>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-3.5 w-[120px]" />
      </div>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-3.5 w-[160px]" />
      </div>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-3.5 w-[140px]" />
      </div>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-3.5 w-[200px]" />
      </div>{" "}
      <div className="flex items-center space-x-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-3.5 w-[130px]" />
      </div>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-3.5 w-[130px]" />
      </div>
    </div>
  );
}

function Row({ id, name, logo, onSelect }) {
  const [loading, setLoading] = useState(false);

  const handleOnSelect = () => {
    setLoading(true);
    onSelect(id);
  };

  return (
    <div className="flex justify-between">
      <div className="flex items-center">
        <Image
          src={logo}
          alt={name}
          className="border rounded-full aspect-square"
          width={36}
          height={36}
        />

        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">{name}</p>
        </div>
      </div>
      <Button
        variant="outline"
        onClick={handleOnSelect}
        data-event="Bank Selected"
        data-icon="🏦"
        data-channel="bank"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connect"}
      </Button>
    </div>
  );
}

export function ConnectGoCardLessModal({ countryCode: initialCountryCode }) {
  const [countryCode, setCountryCode] = useState(initialCountryCode);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);

  const createEndUserAgreement = useAction(createEndUserAgreementAction);

  const [step, setStep] = useQueryState("step", {
    shallow: true,
  });

  const isOpen = step === "gocardless";

  useEffect(() => {
    async function fetchData() {
      try {
        const banks = await getBanks({ countryCode });
        setLoading(false);

        setResults(banks);
        setFilteredResults(banks);
      } catch {
        setLoading(false);
        setResults([]);
        setFilteredResults([]);
      }
    }

    if (
      (isOpen && !results?.length > 0) ||
      countryCode !== initialCountryCode
    ) {
      fetchData();
    }
  }, [isOpen, countryCode]);

  const handleFilterBanks = (value: string) => {
    if (!value) {
      setFilteredResults(results);
    }

    setFilteredResults(
      results.filter((bank) =>
        bank.name.toLowerCase().includes(value.toLowerCase())
      )
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => setStep(null)}>
      <DialogContent>
        <div className="p-4">
          <DialogHeader>
            <div className="flex space-x-4 items-center mb-4">
              <button
                type="button"
                className="items-center rounded border bg-accent p-1"
                onClick={() => setStep("connect")}
              >
                <Icons.ArrowBack />
              </button>
              <DialogTitle className="m-0 p-0">Search Bank</DialogTitle>
            </div>
            <DialogDescription>
              Start by selecting your business bank, once authenticated you can
              select which accounts you want to link to Midday.
            </DialogDescription>

            <div>
              <div className="flex space-x-2 my-3">
                <Input
                  placeholder="Search bank..."
                  type="search"
                  onChange={(evt) => handleFilterBanks(evt.target.value)}
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />

                <CountrySelector
                  defaultValue={countryCode}
                  onSelect={setCountryCode}
                />
              </div>

              <div className="space-y-4 pt-4 h-[400px] overflow-auto scrollbar-hide">
                {loading && <RowsSkeleton />}
                {filteredResults?.map((bank) => {
                  return (
                    <Row
                      key={bank.id}
                      id={bank.id}
                      name={bank.name}
                      logo={bank.logo}
                      onSelect={() => {
                        createEndUserAgreement.execute({
                          institutionId: bank.id,
                          isDesktop: isDesktopApp(),
                          transactionTotalDays: +bank.transaction_total_days,
                        });
                      }}
                    />
                  );
                })}

                {!loading && filteredResults.length === 0 && (
                  <div className="flex flex-col items-center justify-center min-h-[300px]">
                    <p className="font-medium mb-2">No banks found</p>
                    <p className="text-sm text-center text-[#878787]">
                      We could not find any banks matching your
                      <br /> criteria let us know which bank you are looking for
                    </p>

                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setStep("connect")}
                    >
                      Try another provider
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>
      </DialogContent>
    </Dialog>
  );
}
