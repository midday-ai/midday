"use client";

import { createPlaidLinkTokenAction } from "@/actions/institutions/create-plaid-link";
import { exchangePublicToken } from "@/actions/institutions/exchange-public-token";
import { getInstitutions } from "@/actions/institutions/get-institutions";
import { useConnectParams } from "@/hooks/use-connect-params";
import type { Institutions } from "@midday-ai/engine/resources/institutions/institutions";
import { track } from "@midday/events/client";
import { LogEvents } from "@midday/events/events";
import { Button } from "@midday/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { cn } from "@midday/ui/cn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Input } from "@midday/ui/input";
import { Skeleton } from "@midday/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { useDebounce, useScript } from "@uidotdev/usehooks";
import Image from "next/image";
import { useRouter } from "next/navigation";
import CsvLogoDark from "public/assets/csv-dark.png";
import CsvLogo from "public/assets/csv.png";
import ZapierLogo from "public/assets/zapier.png";
import { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { BankLogo } from "../bank-logo";
import { ConnectBankProvider } from "../connect-bank-provider";
import { CountrySelector } from "../country-selector";
import { InstitutionInfo } from "../institution-info";

function SearchSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from(new Array(10), (_, index) => (
        <div className="flex items-center space-x-4" key={index.toString()}>
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex flex-col space-y-1">
            <Skeleton className="h-2 rounded-none w-[140px]" />
            <Skeleton className="h-2 rounded-none w-[40px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

type SearchResultProps = {
  id: string;
  name: string;
  logo: string | null;
  provider: string;
  availableHistory: number;
  openPlaid: () => void;
};

function SearchResult({
  id,
  name,
  logo,
  provider,
  availableHistory,
  openPlaid,
}: SearchResultProps) {
  return (
    <div className="flex justify-between">
      <div className="flex items-center">
        <BankLogo src={logo} alt={name} />

        <div className="ml-4 space-y-1 cursor-default">
          <p className="text-sm font-medium leading-none">{name}</p>
          <InstitutionInfo provider={provider}>
            <span className="text-[#878787] text-xs capitalize">
              Via {provider}
            </span>
          </InstitutionInfo>
        </div>
      </div>

      <ConnectBankProvider
        id={id}
        provider={provider}
        openPlaid={openPlaid}
        availableHistory={availableHistory}
      />
    </div>
  );
}

type ConnectTransactionsModalProps = {
  countryCode: string;
};

export function ConnectTransactionsModal({
  countryCode: initialCountryCode,
}: ConnectTransactionsModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<Institutions["data"]>([]);
  const [plaidToken, setPlaidToken] = useState<string | undefined>();

  const {
    countryCode,
    q: query,
    step,
    setParams,
  } = useConnectParams(initialCountryCode);

  const isOpen = step === "connect";
  const debouncedSearchTerm = useDebounce(query, 100);

  // NOTE: Load SDKs here so it's not unmonted
  useScript("https://cdn.teller.io/connect/connect.js", {
    removeOnUnmount: false,
  });

  const { open: openPlaid } = usePlaidLink({
    token: plaidToken,
    publicKey: "",
    env: process.env.NEXT_PUBLIC_PLAID_ENVIRONMENT!,
    clientName: "Midday",
    product: ["transactions"],
    onSuccess: async (public_token, metadata) => {
      const accessToken = await exchangePublicToken(public_token);

      setParams({
        step: "account",
        provider: "plaid",
        token: accessToken,
        institution_id: metadata.institution?.institution_id,
      });
      track({
        event: LogEvents.ConnectBankAuthorized.name,
        channel: LogEvents.ConnectBankAuthorized.channel,
        provider: "plaid",
      });
    },
    onExit: () => {
      setParams({ step: "connect" });

      track({
        event: LogEvents.ConnectBankCanceled.name,
        channel: LogEvents.ConnectBankCanceled.channel,
        provider: "plaid",
      });
    },
  });

  const handleOnClose = () => {
    setParams(
      {
        step: null,
        countryCode: null,
        q: null,
      },
      {
        // NOTE: Rerender so the overview modal is visible
        shallow: false,
      },
    );
  };

  async function fetchData(query?: string) {
    try {
      setLoading(true);
      const { data } = await getInstitutions({ countryCode, query });
      setLoading(false);

      setResults(data);
    } catch {
      setLoading(false);
      setResults([]);
    }
  }

  useEffect(() => {
    if (
      (isOpen && !results?.length > 0) ||
      countryCode !== initialCountryCode
    ) {
      fetchData();
    }
  }, [isOpen, countryCode]);

  useEffect(() => {
    if (isOpen) {
      fetchData(debouncedSearchTerm ?? undefined);
    }
  }, [debouncedSearchTerm, isOpen]);

  useEffect(() => {
    async function createLinkToken() {
      const token = await createPlaidLinkTokenAction();

      if (token) {
        setPlaidToken(token);
      }
    }

    // NOTE: Only run where Plaid is supported
    if ((isOpen && countryCode === "US") || (isOpen && countryCode === "CA")) {
      createLinkToken();
    }
  }, [isOpen, countryCode]);

  const imports = [
    {
      id: "csc",
      name: "CSV",
      description:
        "Import transactions using a CSV file, you can also use this for backfilling.",
      logo: CsvLogo,
      logoDark: CsvLogoDark,
      onClick: () => {
        setParams({ step: "import-csv" });
      },
    },
    {
      id: "zapier",
      name: "Zapier",
      description:
        "With 6,000+ apps you can automate your process of importing transactions from your bank. For example using a SpreadSheet.",
      logo: ZapierLogo,
      disabled: true,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleOnClose}>
      <DialogContent>
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Connect Transactions</DialogTitle>

            <DialogDescription>
              We work with a variety of banking providers to support as many
              banks as possible. If you can't find yours, manual import is
              available as an alternative.
            </DialogDescription>

            <Tabs defaultValue="banks" className="pt-2">
              <TabsList className="p-0 h-auto space-x-4 bg-transparent">
                <TabsTrigger className="p-0" value="banks">
                  Banks
                </TabsTrigger>
                <TabsTrigger className="p-0" value="import">
                  Import
                </TabsTrigger>
              </TabsList>

              <TabsContent value="banks" className="mt-3">
                <div className="flex space-x-2 relative">
                  <Input
                    placeholder="Search bank..."
                    type="search"
                    onChange={(evt) => setParams({ q: evt.target.value })}
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    value={query ?? ""}
                  />

                  <div className="absolute right-0">
                    <CountrySelector
                      defaultValue={countryCode}
                      onSelect={(countryCode) => {
                        setParams({ countryCode });
                        setResults([]);
                      }}
                    />
                  </div>
                </div>

                <div className="h-[430px] space-y-4 overflow-auto scrollbar-hide pt-2 mt-2">
                  {loading && <SearchSkeleton />}

                  {results?.map((institution) => {
                    if (!institution) {
                      return null;
                    }

                    return (
                      <SearchResult
                        key={institution.id}
                        id={institution.id}
                        name={institution.name}
                        logo={institution.logo}
                        provider={institution.provider}
                        availableHistory={
                          institution.available_history
                            ? +institution.available_history
                            : 0
                        }
                        openPlaid={() => {
                          setParams({ step: null });
                          openPlaid();
                        }}
                      />
                    );
                  })}

                  {!loading && results.length === 0 && (
                    <div className="flex flex-col items-center justify-center min-h-[350px]">
                      <p className="font-medium mb-2">No banks found</p>
                      <p className="text-sm text-center text-[#878787]">
                        We couldn't find a bank matching your criteria.
                        <br /> Let us know, or start with manual import.
                      </p>

                      <div className="mt-4 flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setParams({ step: "import-csv" })}
                        >
                          Import
                        </Button>

                        <Button
                          onClick={() => {
                            router.push("/account/support");
                          }}
                        >
                          Contact us
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="import" className="space-y-4 mt-4">
                {imports.map((provider) => {
                  return (
                    <Card key={provider.id}>
                      <button
                        type="button"
                        className="text-left"
                        onClick={provider.onClick}
                        disabled={provider.disabled}
                      >
                        <div className="flex space-x-2 items-center ml-4">
                          <div
                            className={cn(
                              "w-[40px] h-[40px] mt-[22px] self-start",
                              provider.logoDark && "hidden dark:block",
                            )}
                          >
                            <Image
                              src={provider.logo}
                              width={40}
                              height={40}
                              alt={provider.name}
                              quality={100}
                            />
                          </div>

                          {provider.logoDark && (
                            <div className="mt-[22px] dark:hidden self-start">
                              <Image
                                src={provider.logoDark}
                                width={40}
                                height={40}
                                alt={provider.name}
                                quality={100}
                              />
                            </div>
                          )}

                          <CardHeader className="p-4 pl-2 flex-1">
                            <div className="flex space-x-2">
                              <CardTitle className="text-md mb-0">
                                {provider.name}
                              </CardTitle>

                              {provider.disabled && (
                                <div className="text-[#878787] rounded-md py-1 px-2 border text-[10px]">
                                  Coming soon
                                </div>
                              )}
                            </div>
                            <CardDescription className="text-sm">
                              {provider.description}
                            </CardDescription>
                          </CardHeader>
                        </div>
                      </button>
                    </Card>
                  );
                })}
              </TabsContent>
            </Tabs>
          </DialogHeader>
        </div>
      </DialogContent>
    </Dialog>
  );
}
