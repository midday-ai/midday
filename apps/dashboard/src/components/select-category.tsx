import { updateSimilarTransactionsAction } from "@/actions/update-similar-transactions-action";
import { updateTransactionAction } from "@/actions/update-transaction-action";
import { useI18n } from "@/locales/client";
import { createClient } from "@midday/supabase/client";
import {
  getCurrentUserTeamQuery,
  getSimilarTransactions,
} from "@midday/supabase/queries";
import { Label } from "@midday/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Skeleton } from "@midday/ui/skeleton";
import { ToastAction } from "@midday/ui/toast";
import { useToast } from "@midday/ui/use-toast";
import { useAction } from "next-safe-action/hook";
import { useEffect, useState } from "react";
import { CategoryIcon, categories } from "./category";

export function SelectCategory({ id, name, selectedId, isLoading }) {
  const [value, setValue] = useState();
  const supabase = createClient();
  const t = useI18n();
  const { toast } = useToast();
  const updateTransaction = useAction(updateTransactionAction);
  const updateSimilarTransactions = useAction(updateSimilarTransactionsAction);

  const handleOnValueChange = async (category: string) => {
    updateTransaction.execute({ id, category });
    const { data: userData } = await getCurrentUserTeamQuery(supabase);
    const transactions = await getSimilarTransactions(supabase, {
      name,
      teamId: userData?.team_id,
    });

    if (transactions?.data?.length) {
      toast({
        duration: 6000,
        variant: "ai",
        title: "Midday AI",
        description: `Do you want to mark ${
          transactions?.data?.length
        } similar transactions form ${name} as ${t(
          `categories.${category}`
        )} too?`,
        footer: (
          <div className="flex space-x-2">
            <ToastAction altText="Cancel" className="pl-5 pr-5">
              Cancel
            </ToastAction>
            <ToastAction
              altText="Yes"
              onClick={() => updateSimilarTransactions.execute({ id })}
              className="pl-5 pr-5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Yes
            </ToastAction>
          </div>
        ),
      });
    }
  };

  useEffect(() => {
    setValue(selectedId);
  }, [selectedId]);

  return (
    <div className="relative">
      <Label htmlFor="category">Category</Label>

      <div className="mt-1">
        {isLoading ? (
          <div className="h-[36px] border rounded-md">
            <Skeleton className="h-[14px] w-[40%] rounded-sm absolute left-3 top-[39px]" />
          </div>
        ) : (
          <Select value={value} onValueChange={handleOnValueChange}>
            <SelectTrigger id="category" className="line-clamp-1 truncate">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(categories).map((category) => (
                <SelectItem key={category} value={category}>
                  <div className="flex space-x-2">
                    <CategoryIcon name={category} />
                    <span>{t(`categories.${category}`)}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
