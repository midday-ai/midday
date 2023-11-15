"use client";

import { useCurrentLocale } from "@/locales/client";
import { formatAmount } from "@/utils/format";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";
import { cn } from "@midday/ui/utils";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { AssignUser } from "./assign-user";
import { Attachments } from "./attachments";
import { Note } from "./note";
import { SelectCategory } from "./select-category";

export function TransactionDetails({ transactionId, onClose, data }) {
  const locale = useCurrentLocale();
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, [data]);

  return (
    <div className="border h-full min-h-[calc(100vh-150px)] w-full p-6">
      <div className="sticky top-12">
        <div className="flex justify-between mb-8">
          <div className="flex-1 flex-col">
            {isLoading ? (
              <Skeleton className="w-[10%] h-[14px] rounded-full mt-1 mb-6" />
            ) : (
              <span className="text-[#606060] text-xs">
                {data?.date && format(new Date(data.date), "MMM d, Y")}
              </span>
            )}

            <h2 className="mt-4 mb-3">
              {isLoading ? (
                <Skeleton className="w-[35%] h-[22px] rounded-md mb-4" />
              ) : (
                data?.name
              )}
            </h2>
            <div className="flex flex-col">
              {isLoading ? (
                <div className="flex flex-col space-y-3 mb-[5px]">
                  <Skeleton className="w-[50%] h-[32px] rounded-md mb-2" />
                  <Skeleton className="w-[20%] h-[15px] rounded-md" />
                </div>
              ) : (
                <div className="flex flex-col space-y-3">
                  <span
                    className={cn(
                      "text-4xl",
                      data?.amount > 0 && "text-[#00C969]"
                    )}
                  >
                    {formatAmount({
                      amount: data?.amount,
                      currency: data?.currency,
                      locale,
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="p-0 m-0 w-4 h-4"
            onClick={onClose}
          >
            <Icons.Close className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6 mb-2">
          <SelectCategory
            isLoading={isLoading}
            name={data?.name}
            id={transactionId}
            selectedId={data?.category ?? undefined}
          />

          <AssignUser
            isLoading={isLoading}
            id={transactionId}
            selectedId={data?.assigned?.id ?? undefined}
          />
        </div>

        <Accordion type="multiple" defaultValue={["attachment"]}>
          <AccordionItem value="attachment">
            <AccordionTrigger>Attachment</AccordionTrigger>
            <AccordionContent>
              <Attachments id={data?.id} data={data?.attachments} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="note">
            <AccordionTrigger>Note</AccordionTrigger>
            <AccordionContent>
              <Note id={transactionId} defaultValue={data?.note} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
