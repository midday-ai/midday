"use client";

import { createGoCardLessLinkAction } from "@/actions/institutions/create-gocardless-link";
import { createPlaidLinkTokenAction } from "@/actions/institutions/create-plaid-link";
import { getInstitutions } from "@/actions/institutions/get-institutions";
import { updateInstitutionUsageAction } from "@/actions/institutions/update-institution-usage";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
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
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
import { useDebounce } from "@uidotdev/usehooks";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";
import { useEffect, useState } from "react";
import { CountrySelector } from "../country-selector";
import { InstitutionInfo } from "../institution-info";

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
      </div>
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

type RowProps = {
  id: string;
  name: string;
  logo: string;
  provider: string;
  countryCode: string;
  availableHistory: number;
};

function Row({
  id,
  name,
  logo,
  provider,
  countryCode,
  availableHistory,
}: RowProps) {
  const updateInstitutionUsage = useAction(updateInstitutionUsageAction);
  const createGoCardLessLink = useAction(createGoCardLessLinkAction, {
    onSuccess: (data) => {
      console.log(data);
    },
    onError: (data) => {
      console.log("error", data);
    },
  });

  const createPlaidLinkToken = useAction(createPlaidLinkTokenAction, {
    onSuccess: (data) => {
      console.log(data);
    },
    onError: (data) => {
      console.log("error", data);
    },
  });

  const isLoading =
    createGoCardLessLink.status === "executing" ||
    createPlaidLinkToken.status === "executing";

  const handleOnSelect = () => {
    updateInstitutionUsage.execute({
      institutionId: id,
    });

    switch (provider) {
      case "gocardless": {
        createGoCardLessLink.execute({
          institutionId: id,
          availableHistory,
          countryCode,
          redirectBase: isDesktopApp() ? "midday://" : window.location.origin,
        });

        return;
      }

      case "plaid": {
        createPlaidLinkToken.execute(undefined);

        return;
      }

      default:
        return;
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");

    if (parts.length > 1) {
      return `${parts.at(0)?.charAt(0)}${parts.at(1)?.charAt(0)}`;
    }

    return `${name.charAt(0)}${name.charAt(1)}`;
  };

  return (
    <div className="flex justify-between">
      <div className="flex items-center">
        <Avatar>
          <AvatarImage src={logo} alt={name} />
          <AvatarFallback>{getInitials(name)}</AvatarFallback>
        </Avatar>

        <div className="ml-4 space-y-1 cursor-default">
          <p className="text-sm font-medium leading-none">{name}</p>
          <InstitutionInfo provider={provider}>
            <span className="text-[#878787] text-xs capitalize">
              Via {provider}
            </span>
          </InstitutionInfo>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={handleOnSelect}
        data-event="Bank Selected"
        data-icon="🏦"
        data-channel="bank"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connect"}
      </Button>
    </div>
  );
}

type SearchInstitutionsModalProps = {
  countryCode: string;
};

export function SearchInstitutionsModal({
  countryCode: initialCountryCode,
}: SearchInstitutionsModalProps) {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);

  const [params, setParams] = useQueryStates({
    step: parseAsStringEnum(["connect", "account", "gocardless"]),
    countryCode: parseAsString.withDefault(initialCountryCode),
    q: parseAsString,
  });

  const { countryCode, q: query, step } = params;

  const isOpen = step === "connect";
  const debouncedSearchTerm = useDebounce(query, 100);

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

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() =>
        setParams({
          step: null,
          countryCode: null,
          q: null,
        })
      }
    >
      <DialogContent>
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Connect Bank</DialogTitle>

            <DialogDescription>
              Start by selecting your bank, once authenticated you can select
              which accounts you want to link to Midday.
            </DialogDescription>

            <div>
              <div className="flex space-x-2 my-3 relative">
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
                    onSelect={(countryCode) => setParams({ countryCode })}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 h-[400px] overflow-auto scrollbar-hide">
                {loading && <RowsSkeleton />}

                {results?.map((institution) => {
                  return (
                    <Row
                      key={institution.id}
                      id={institution.id}
                      name={institution.name}
                      logo={institution.logo}
                      provider={institution.provider}
                      availableHistory={+institution.availableHistory}
                      countryCode={countryCode}
                    />
                  );
                })}

                {!loading && results.length === 0 && (
                  <div className="flex flex-col items-center justify-center min-h-[300px]">
                    <p className="font-medium mb-2">No banks found</p>
                    <p className="text-sm text-center text-[#878787]">
                      We could not find any banks matching your
                      <br /> criteria let us know which bank you are looking for
                    </p>

                    <Button variant="outline" className="mt-4">
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
