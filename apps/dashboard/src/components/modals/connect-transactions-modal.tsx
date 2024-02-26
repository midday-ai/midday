"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import {
  Tabs,
  TabsContent,
  //  TabsList, TabsTrigger
} from "@midday/ui/tabs";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import GoCardLessLogo from "./gocardless.png";
import PlaidLogo from "./plaid.png";
import TellerLogo from "./teller.png";

export function ConnectTransactionsModal({ countryCode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isOpen = searchParams.get("step") === "connect";

  const banks = [
    {
      id: "gocardless",
      name: "GoCardless (Europe)",
      description:
        "More than 2,500 connected banks in 31 countries across the UK and Europe.",
      logo: GoCardLessLogo,
      onClick: () => router.push("?step=gocardless"),
    },
    {
      id: "teller",
      name: "Teller (US)",
      description:
        "With Teller we can connect to  instantly with more than 5,000 financial institutions in the US.",
      logo: TellerLogo,
      disabled: true,
    },
    {
      id: "plaid",
      name: "Plaid (US, Canada, UK)",
      description: `12,000+ financial institutions across the US, Canada, UK, and Europe are covered by Plaid's network`,
      logo: PlaidLogo,
      disabled: true,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={() => router.push(pathname)}>
      <DialogContent>
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Connect Transactions</DialogTitle>
            <DialogDescription>
              We use various providers based on your account location. If you
              can't establish a connection, manual import is available as an
              alternative.
            </DialogDescription>
          </DialogHeader>
        </div>

        <Tabs defaultValue="banks" className="p-4 pt-0">
          {/* <TabsList className="p-0 h-auto space-x-4 bg-transparent">
            <TabsTrigger className="p-0" value="banks">
              Banks
            </TabsTrigger>
            <TabsTrigger className="p-0" value="import">
              Import
            </TabsTrigger>
          </TabsList> */}

          <TabsContent value="banks" className="space-y-4 mt-4">
            {banks.map((bank) => {
              return (
                <Card key={bank.id}>
                  <button
                    type="button"
                    className="text-left"
                    onClick={bank.onClick}
                    disabled={bank.disabled}
                  >
                    <div className="flex space-x-2 items-center ml-4">
                      <Image
                        className="mt-4 self-start"
                        src={bank.logo}
                        width={40}
                        height={40}
                        alt={bank.name}
                        quality={100}
                      />

                      <CardHeader className="p-4 pl-2">
                        <div className="flex space-x-2">
                          <CardTitle className="text-md mb-0">
                            {bank.name}
                          </CardTitle>

                          {bank.disabled && (
                            <div className="text-[#878787] rounded-md py-1 px-2 border text-[10px]">
                              Comming soon
                            </div>
                          )}
                        </div>
                        <CardDescription className="text-sm">
                          {bank.description}
                        </CardDescription>
                      </CardHeader>
                    </div>
                  </button>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="import">import</TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
