"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { BankAccount } from "./bank-account";
import { BankLogo } from "./bank-logo";
import { SyncTransactions } from "./sync-transactions";

export function BankConnections({ data }) {
  return (
    <div className="px-6 pb-6 space-y-6 divide-y">
      <Accordion type="multiple" className="w-full">
        {data.map((connection) => {
          return (
            <AccordionItem
              value={connection.id}
              key={connection.id}
              className="border-none"
            >
              <div className="flex justify-between items-center">
                <AccordionTrigger
                  className="justify-start text-start w-full"
                  chevronBefore
                >
                  <div className="flex space-x-4 items-center ml-4 w-full">
                    <BankLogo src={connection.logo_url} alt={connection.name} />

                    <div className="flex flex-col">
                      <span className="text-sm">{connection.name}</span>

                      <TooltipProvider delayDuration={70}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "text-xs text-[#878787] font-normal flex items-center space-x-1",
                                connection.error && "text-[#c33839]",
                              )}
                            >
                              {connection.error && <Icons.Error />}
                              <span>
                                {connection.error
                                  ? "Syncing issue detected"
                                  : connection.last_accessed
                                    ? `Updated ${formatDistanceToNow(
                                        new Date(connection.last_accessed),
                                      )} ago`
                                    : "Never accessed"}
                              </span>
                            </div>
                          </TooltipTrigger>

                          {connection.error && (
                            <TooltipContent
                              className="px-3 py-1.5 text-xs max-w-[430px]"
                              sideOffset={20}
                              side="left"
                            >
                              The login details for this connection have changed
                              (credentials, MFA, or similar) click here to
                              restore the connection to a good state.
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </AccordionTrigger>

                <div className="ml-auto">
                  <SyncTransactions />
                </div>
              </div>

              <AccordionContent className="bg-background">
                <div className="ml-[30px] divide-y">
                  {connection.accounts.map((account) => {
                    return (
                      <BankAccount
                        id={account.id}
                        name={account.name}
                        enabled={account.enabled}
                        manual={account.manual}
                        currency={account.currency}
                        balance={account.balance ?? 0}
                        type={account.type}
                      />
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
