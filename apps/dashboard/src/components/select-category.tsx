import {
  updateSimilarTransactionsAction,
  updateTransactionAction,
} from "@/actions";
import { useI18n } from "@/locales/client";
import { getSupabaseBrowserClient } from "@midday/supabase/browser-client";
import { getSimilarTransactions } from "@midday/supabase/queries";
import { Button } from "@midday/ui/button";
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
import { useEffect, useState } from "react";

const categories = [
  "office_supplies",
  "travel",
  "rent",
  "income",
  "software",
  "transfer",
  "meals",
  "equipment",
];

export function SelectCategory({ id, name, selectedId, isLoading }) {
  const [value, setValue] = useState();
  const supabase = getSupabaseBrowserClient();
  const t = useI18n();
  const { toast } = useToast();

  const handleUpdateSimilar = () => {
    updateSimilarTransactionsAction(id);
  };

  const handleOnValueChange = async (value: string) => {
    await updateTransactionAction(id, { category: value });
    const transactions = await getSimilarTransactions(supabase, id);

    if (transactions?.data?.length) {
      toast({
        duration: 6000,
        description: `Categorize ${transactions?.data?.length} transactions form ${name} as ${value} too?`,
        action: (
          <ToastAction altText="Yes" onClick={handleUpdateSimilar}>
            Yes
          </ToastAction>
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
            <Skeleton className="h-[14px] w-[60%] rounded-sm absolute left-3 top-[35px]" />
          </div>
        ) : (
          <Select value={value} onValueChange={handleOnValueChange}>
            <SelectTrigger id="category" className="line-clamp-1 truncate">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {t(`categories.${category}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
