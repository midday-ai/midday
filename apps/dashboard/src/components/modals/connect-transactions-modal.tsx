"use client";

import { createPlaidLinkTokenAction } from "@/actions/institutions/create-plaid-link";
import { exchangePublicToken } from "@/actions/institutions/exchange-public-token";
import { useConnectParams } from "@/hooks/use-connect-params";
import { useTRPC } from "@/trpc/client";
import { track } from "@midday/events/client";
import { LogEvents } from "@midday/events/events";
import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Input } from "@midday/ui/input";
import { Skeleton } from "@midday/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useDebounceValue, useScript } from "usehooks-ts";
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

function formatProvider(provider: string) {
  switch (provider) {
    case "enablebanking":
      return "Enable Banking";
    case "gocardless":
      return "GoCardLess";
    case "plaid":
      return "Plaid";
    case "teller":
      return "Teller";
  }
}

type SearchResultProps = {
  id: string;
  name: string;
  logo: string | null;
  provider: string;
  availableHistory: number;
  maximumConsentValidity: number;
  openPlaid: () => void;
  type?: "personal" | "business";
};

function SearchResult({
  id,
  name,
  logo,
  provider,
  availableHistory,
  openPlaid,
  maximumConsentValidity,
  type,
}: SearchResultProps) {
  return (
    <div className="flex justify-between">
      <div className="flex items-center">
        <BankLogo src={logo} alt={name} />

        <div className="ml-4 space-y-1 cursor-default">
          <p className="text-sm font-medium leading-none">{name}</p>
          <InstitutionInfo provider={provider}>
            <span className="text-[#878787] text-xs capitalize">
              Via {formatProvider(provider)}
              {type ? ` • ${type}` : ""}
            </span>
          </InstitutionInfo>
        </div>
      </div>

      <ConnectBankProvider
        id={id}
        name={name}
        provider={provider}
        openPlaid={openPlaid}
        maximumConsentValidity={maximumConsentValidity}
        availableHistory={availableHistory}
        type={type}
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
  const trpc = useTRPC();
  const router = useRouter();
  const [plaidToken, setPlaidToken] = useState<string | undefined>();
  const {
    countryCode,
    q: query,
    step,
    setParams,
  } = useConnectParams(initialCountryCode);

  const isOpen = step === "connect";

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
      const { access_token, item_id } = await exchangePublicToken(public_token);

      setParams({
        step: "account",
        provider: "plaid",
        token: access_token,
        ref: item_id,
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
    setParams({
      step: null,
      countryCode: null,
      q: null,
      ref: null,
    });
  };

  const [debouncedQuery] = useDebounceValue(query ?? "", 200);

  const { data, isLoading } = useQuery(
    trpc.institutions.get.queryOptions(
      {
        q: debouncedQuery,
        countryCode,
      },
      {
        enabled: isOpen,
      },
    ),
  );

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

  return (
    <Dialog open={isOpen} onOpenChange={handleOnClose}>
      <DialogContent>
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Connect bank account</DialogTitle>

            <DialogDescription>
              We work with a variety of banking providers to support as many
              banks as possible. If you can't find yours,{" "}
              <button
                type="button"
                className="underline"
                onClick={() => setParams({ step: "import" })}
              >
                manual import
              </button>{" "}
              is available as an alternative.
            </DialogDescription>

            <div className="pt-4">
              <div className="flex space-x-2 relative">
                <Input
                  placeholder="Search bank..."
                  type="search"
                  onChange={(evt) => setParams({ q: evt.target.value || null })}
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  autoFocus
                  value={query ?? ""}
                />

                <div className="absolute right-0">
                  <CountrySelector
                    defaultValue={countryCode}
                    onSelect={(countryCode) => {
                      setParams({ countryCode });
                    }}
                  />
                </div>
              </div>

              <div className="h-[430px] space-y-4 overflow-auto scrollbar-hide pt-2 mt-2">
                {isLoading && <SearchSkeleton />}

                {data?.map((institution) => {
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
                      // GoCardLess
                      availableHistory={
                        institution.available_history
                          ? +institution.available_history
                          : 0
                      }
                      // EnableBanking
                      maximumConsentValidity={
                        institution.maximum_consent_validity
                          ? +institution.maximum_consent_validity
                          : 0
                      }
                      type={institution?.type}
                      openPlaid={() => {
                        setParams({ step: null });
                        openPlaid();
                      }}
                    />
                  );
                })}

                {!isLoading && data?.length === 0 && (
                  <div className="flex flex-col items-center justify-center min-h-[350px]">
                    <p className="font-medium mb-2">No banks found</p>
                    <p className="text-sm text-center text-[#878787]">
                      We couldn't find a bank matching your criteria.
                      <br /> Let us know, or start with manual import.
                    </p>

                    <div className="mt-4 flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setParams({ step: "import" })}
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
            </div>
          </DialogHeader>
        </div>
      </DialogContent>
    </Dialog>
  );
}
