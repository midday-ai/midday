"use client";

import {
  buildLink,
  createEndUserAgreement,
  getAccessToken,
  getBanks,
} from "@/actions/gocardless";
import { Avatar, AvatarImage } from "@midday/ui/avatar";
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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function BankRow({ id, name, logo, onSelect }) {
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
        {loading ? (
          <Icons.Loader className="w-4 h-4 animate-spin" />
        ) : (
          "Connect"
        )}
      </Button>
    </div>
  );
}

export default function ConnectBankModal() {
  const router = useRouter();
  const [token, setToken] = useState();
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const { access } = await getAccessToken();
      const banks = await getBanks({ token: access, country: "se" });
      setToken(access);
      setResults(banks);
      setFilteredResults(banks);
    }

    fetchData();
  }, []);

  const handleCreateEndUserAgreement = async (institutionId: string) => {
    const data = await createEndUserAgreement({ institutionId, token });

    const { link } = await buildLink({
      redirect: `${location.origin}/onboarding?step=account`,
      token,
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
        bank.name.toLowerCase().includes(value.toLowerCase()),
      ),
    );
  };

  return (
    <Dialog defaultOpen onOpenChange={() => router.back()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect bank</DialogTitle>
          <DialogDescription>
            Select your bank and follow the steps below, we will have access to
            2 years of historical transactions and will have access for 3
            months. We will notify you once you need to connect again.
          </DialogDescription>

          <div>
            <Input
              placeholder="Search bank"
              autoComplete={false}
              type="search"
              className="my-2"
              onChange={(evt) => handleFilterBanks(evt.target.value)}
            />
            <div className="space-y-6 pt-4 h-[400px] overflow-auto scrollbar-hide">
              {filteredResults.length === 0 && <p>No banks found</p>}
              {filteredResults.map((bank) => {
                return (
                  <BankRow
                    key={bank.id}
                    id={bank.id}
                    name={bank.name}
                    logo={bank.logo}
                    onSelect={() => handleCreateEndUserAgreement(bank.id)}
                  />
                );
              })}
            </div>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
