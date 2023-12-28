"use client";

import {
  buildLink,
  createEndUserAgreement,
  getBanks,
} from "@midday/gocardless";
import { Avatar, AvatarImage } from "@midday/ui/avatar";
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
import { Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

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
        <Avatar className="flex h-9 w-9 items-center justify-center space-y-0 border">
          <AvatarImage src={logo} alt={name} />
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">{name}</p>
        </div>
      </div>
      <Button variant="outline" onClick={handleOnSelect}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connect"}
      </Button>
    </div>
  );
}

export function ConnectBankModal({ countryCode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const isOpen = searchParams.get("step") === "bank";

  useEffect(() => {
    async function fetchData() {
      const banks = await getBanks(countryCode);
      setLoading(false);

      if (banks.length > 0) {
        setResults(banks);
        setFilteredResults(banks);
      }
    }

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const handleCreateEndUserAgreement = async (institutionId: string) => {
    const data = await createEndUserAgreement(institutionId);

    const { link } = await buildLink({
      redirect: `${location.origin}/${pathname}?step=account`,
      institutionId,
      agreement: data.id,
    });

    router.push(link);
  };

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
    <Dialog open={isOpen} onOpenChange={() => router.push(pathname)}>
      <DialogContent>
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Connect bank</DialogTitle>
            <DialogDescription>
              Start by selecting your business bank, once authenticated you can
              select which accounts you want to link to your account.
            </DialogDescription>

            <div>
              <Input
                placeholder="Search bank"
                autoComplete={false}
                type="search"
                className="my-2"
                onChange={(evt) => handleFilterBanks(evt.target.value)}
              />
              <div className="space-y-4 pt-4 h-[400px] overflow-auto scrollbar-hide">
                {loading && <RowsSkeleton />}
                {filteredResults?.map((bank) => {
                  return (
                    <Row
                      key={bank.id}
                      id={bank.id}
                      name={bank.name}
                      logo={bank.logo}
                      onSelect={() => handleCreateEndUserAgreement(bank.id)}
                    />
                  );
                })}
                {!loading && filteredResults.length === 0 && (
                  <div className="flex flex-col items-center justify-center min-h-[300px]">
                    <p className="font-medium mb-2">No banks found</p>
                    <p className="text-sm text-center text-[#878787]">
                      We could not find any banks matching your
                      <br /> criteria let us know which bank you are looking for
                      <br />
                      <a href="mailto:support@midday.ai" className="underline">
                        support@midday.ai
                      </a>
                    </p>
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
