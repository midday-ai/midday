"use client";

import { track } from "@midday/events/client";
import { LogEvents } from "@midday/events/events";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Skeleton } from "@midday/ui/skeleton";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useDebounceValue, useScript } from "usehooks-ts";
import { useConnectParams } from "@/hooks/use-connect-params";
import { useTRPC } from "@/trpc/client";
import { BankLogo } from "./bank-logo";
import { ConnectBankProvider } from "./connect-bank-provider";
import { CountrySelector } from "./country-selector";

const nameWidths = [140, 100, 180, 120, 160, 130, 150, 110, 170, 90];

function SearchSkeleton() {
  return (
    <div className="space-y-0.5">
      {Array.from(new Array(10), (_, index) => (
        <div
          className="flex justify-between items-center -mx-2 px-2 py-2"
          key={index.toString()}
        >
          <div className="flex items-center">
            <Skeleton className="h-[34px] w-[34px] rounded-full shrink-0" />
            <div className="flex flex-col space-y-1.5 ml-3">
              <Skeleton
                className="h-2.5 rounded-none"
                style={{ width: nameWidths[index] }}
              />
              <Skeleton className="h-2 rounded-none w-[60px]" />
            </div>
          </div>
          <Skeleton className="h-3 w-[50px] rounded-none opacity-50" />
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
  openPlaid: () => void;
  type?: "personal" | "business";
  redirectPath?: string;
  countryCode?: string;
};

function SearchResult({
  id,
  name,
  logo,
  provider,
  availableHistory,
  openPlaid,
  type,
  redirectPath,
  countryCode,
}: SearchResultProps) {
  const connectRef = useRef<(() => void) | null>(null);

  return (
    <div
      onClick={() => connectRef.current?.()}
      className="group flex justify-between items-center cursor-pointer hover:bg-accent/50 -mx-2 px-2 py-2 rounded-md transition-colors"
    >
      <div className="flex items-center min-w-0">
        <BankLogo src={logo} alt={name} />

        <div className="ml-3 min-w-0">
          <p className="text-sm font-medium leading-none truncate">{name}</p>
          <span className="text-[#878787] text-xs capitalize mt-0.5 block">
            Via {formatProvider(provider)}
            {type ? ` · ${type}` : ""}
          </span>
        </div>
      </div>

      <ConnectBankProvider
        id={id}
        provider={provider}
        openPlaid={openPlaid}
        availableHistory={availableHistory}
        redirectPath={redirectPath}
        countryCode={countryCode}
        connectRef={connectRef}
      />
    </div>
  );
}

type BankSearchContentProps = {
  enabled: boolean;
  redirectPath?: string;
  listHeight?: string;
  defaultCountryCode?: string;
  fadeGradientClass?: string;
  emptyState?:
    | React.ReactNode
    | ((context: { query: string; countryCode: string }) => React.ReactNode);
};

export function BankSearchContent({
  enabled,
  redirectPath,
  listHeight = "h-[430px]",
  fadeGradientClass,
  defaultCountryCode,
  emptyState,
}: BankSearchContentProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const [plaidToken, setPlaidToken] = useState<string | undefined>();
  const teamCountryCode = defaultCountryCode || "";

  const {
    countryCode,
    search: query,
    setParams,
  } = useConnectParams(teamCountryCode);

  const createPlaidLink = useMutation(
    trpc.banking.plaidLink.mutationOptions({
      onSuccess: (result) => {
        if (result.data.link_token) {
          setPlaidToken(result.data.link_token);
        }
      },
    }),
  );

  const exchangeToken = useMutation(
    trpc.banking.plaidExchange.mutationOptions(),
  );

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
      const result = await exchangeToken.mutateAsync({
        token: public_token,
      });

      setParams({
        step: "account",
        provider: "plaid",
        token: result.data.access_token,
        ref: result.data.item_id,
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

  const [debouncedQuery] = useDebounceValue(query ?? "", 200);

  const { data, isLoading } = useQuery({
    ...trpc.institutions.get.queryOptions(
      {
        q: debouncedQuery,
        countryCode,
        excludeProviders: ["gocardless"],
      },
      {
        enabled,
      },
    ),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (enabled && (countryCode === "US" || countryCode === "CA")) {
      createPlaidLink.mutate();
    }
  }, [enabled, countryCode]);

  return (
    <div>
      <div className="flex space-x-2 relative">
        <Input
          placeholder="Search bank..."
          type="search"
          onChange={(evt) => setParams({ search: evt.target.value || null })}
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

      <div className="relative">
        <div
          className={`${listHeight} space-y-0.5 overflow-auto scrollbar-hide pt-2 mt-2 pb-16`}
        >
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
                availableHistory={
                  institution.availableHistory
                    ? +institution.availableHistory
                    : 0
                }
                type={institution?.type ?? undefined}
                openPlaid={() => {
                  setParams({ step: null });
                  openPlaid();
                }}
                redirectPath={redirectPath}
                countryCode={countryCode}
              />
            );
          })}

          {!isLoading &&
            data?.length === 0 &&
            (typeof emptyState === "function" ? (
              emptyState({ query: debouncedQuery, countryCode })
            ) : emptyState ? (
              emptyState
            ) : (
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
            ))}
        </div>
        {fadeGradientClass && (
          <div
            className={`pointer-events-none absolute bottom-0 left-0 right-0 h-16 ${fadeGradientClass}`}
          />
        )}
      </div>
    </div>
  );
}
