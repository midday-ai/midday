import { getSupabaseBrowserClient } from "@midday/supabase/browser-client";
import { getTransaction } from "@midday/supabase/queries";
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
import { useEffect, useRef, useState } from "react";
import { AssignUser } from "./assign-user";
import { Attachments } from "./attachments";
import { Note } from "./note";
import { NumberFormat } from "./number-format";
import { SelectVat } from "./select-vat";

export function TransactionDetails({ transactionId, onClose }) {
  const supabase = getSupabaseBrowserClient();
  const [data, setData] = useState();
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    async function fetchData() {
      const result = await getTransaction(supabase, transactionId);

      if (result) {
        setData(result.data);
        setLoading(false);
      }
    }

    fetchData();
  }, [transactionId, supabase]);

  return (
    <div className="border h-full min-h-[calc(100vh-150px)] w-full p-6">
      <div className="sticky top-12">
        <div className="flex justify-between mb-4">
          <div className="flex-1 flex-col">
            {isLoading ? (
              <Skeleton className="w-[10%] h-[14px] rounded-full mt-1 mb-6" />
            ) : (
              <span className="text-[#606060] text-xs">
                {data?.date && format(new Date(data.date), "MMM d")}
              </span>
            )}

            <h2 className="mt-4 mb-3">
              {isLoading ? (
                <Skeleton className="w-[35%] h-[22px] rounded-full mb-4" />
              ) : (
                data?.name
              )}
            </h2>
            <div className="flex flex-col">
              {isLoading ? (
                <Skeleton className="w-[50%] h-[32px] rounded-full mb-1" />
              ) : (
                <NumberFormat
                  amount={data?.amount}
                  currency={data?.currency}
                  className={cn(
                    "text-4xl",
                    data?.amount > 0 && "text-[#00E547]",
                  )}
                />
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

        <Accordion type="multiple" defaultValue={["attachment", "general"]}>
          <AccordionItem value="general">
            <AccordionTrigger>General</AccordionTrigger>
            <AccordionContent>
              <p className="text-[#606060]">
                Fusce id lobortis elit. Sed tincidunt efficitur elit, nec
                molestie justo imperdiet quis.
              </p>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="grid gap-2 w-full">
                  <AssignUser
                    isLoading={isLoading}
                    id={transactionId}
                    selectedId={data?.assigned?.id}
                  />
                </div>
                <div className="grid gap-2 w-full">
                  <SelectVat
                    isLoading={isLoading}
                    id={transactionId}
                    selectedId={data?.vat ?? undefined}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

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
