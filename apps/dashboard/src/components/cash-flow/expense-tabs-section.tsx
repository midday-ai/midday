import {
  BankAccountSchema,
  UserSchema,
  UserTier,
} from "@midday/supabase/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { ExpenseGrowthRateSection } from "./expense-growth-rate-section";
import { ExpenseSection } from "./expense-section";
import { InventoryCostSection } from "./inventory-cost-section";

interface ExpenseTabSectionProps {
  isEmpty: boolean;
  accounts: BankAccountSchema[];
  user: UserSchema | null;
  tier: UserTier;
  value: {
    to?: string;
    from?: string;
  };
  defaultValue: {
    from: string;
    to: string;
    period: string;
    type: string;
  };
}

export function ExpenseTabsSection({
  isEmpty,
  accounts,
  user,
  tier,
  value,
  defaultValue,
}: ExpenseTabSectionProps) {
  return (
    <Tabs defaultValue="expense">
      <TabsList className="w-fit flex flex-1 gap-2 rounded-2xl">
        <TabsTrigger value="expense">Expense</TabsTrigger>
        <TabsTrigger value="inventory">Inventory Cost</TabsTrigger>
        <TabsTrigger value="growthRate">Expense Growth Rate</TabsTrigger>
      </TabsList>
      <TabsContent value="expense">
        <ExpenseSection
          isEmpty={isEmpty}
          accounts={accounts}
          user={user}
          tier={tier}
          value={value}
          defaultValue={defaultValue}
        />
      </TabsContent>
      <TabsContent value="inventory">
        <InventoryCostSection
          isEmpty={isEmpty}
          accounts={accounts}
          user={user}
          tier={tier}
          value={value}
          defaultValue={defaultValue}
        />
      </TabsContent>
      <TabsContent value="growthRate">
        <ExpenseGrowthRateSection
          isEmpty={isEmpty}
          accounts={accounts}
          user={user}
          tier={tier}
          value={value}
          defaultValue={defaultValue}
        />
      </TabsContent>
    </Tabs>
  );
}
