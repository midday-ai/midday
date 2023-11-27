import {
  updateSimilarTransactionsAction,
  updateTransactionAction,
} from "@/actions";
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
import { useEffect, useState } from "react";
import { CategoryIcon } from "./category";

const categories = [
  "office_supplies",
  "travel",
  "rent",
  "income",
  "software",
  "transfer",
  "meals",
  "equipment",
  "activity",
  "other",
  "taxes",
  "internet_and_telephone",
  "facilities_expenses",
  "uncategorized",
];

export function SelectCategory({ id, name, selectedId, isLoading }) {
  const [value, setValue] = useState();
  const supabase = createClient();
  const t = useI18n();
  const { toast } = useToast();

  const handleUpdateSimilar = () => {
    updateSimilarTransactionsAction(id);
  };

  const handleOnValueChange = async (value: string) => {
    await updateTransactionAction(id, { category: value });
    const { data: userData } = await getCurrentUserTeamQuery(supabase);
    const transactions = await getSimilarTransactions(supabase, {
      name,
      teamId: userData?.team_id,
    });

    if (transactions?.data?.length) {
      toast({
        duration: 6000,
        description: `Do you want to mark ${
          transactions?.data?.length
        } similar transactions form ${name} as ${t(
          `categories.${value}`
        )} too?`,
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
            <Skeleton className="h-[14px] w-[40%] rounded-sm absolute left-3 top-[39px]" />
          </div>
        ) : (
          <Select value={value} onValueChange={handleOnValueChange}>
            <SelectTrigger id="category" className="line-clamp-1 truncate">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
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
