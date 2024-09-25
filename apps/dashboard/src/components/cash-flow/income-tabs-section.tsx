import Tier from "@/config/tier";
import { BankAccountSchema, UserSchema } from "@midday/supabase/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { IncomeSection } from "./income-section";

interface IncomeTabsSectionProps {
  isEmpty: boolean;
  accounts: BankAccountSchema[];
  user: UserSchema | null;
  tier: Tier;
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

export function IncomeTabsSection({ isEmpty, accounts, user, tier, value, defaultValue }: IncomeTabsSectionProps) {
  const description = `
    Effective income management is the lifeblood of any evolving business venture, serving as a critical determinant of profitability and financial resilience. In today's dynamic market landscape, astute entrepreneurs recognize that meticulous oversight and strategic adjustment of income streams are not merely beneficial—they are imperative.
  `;

  return (
    <Tabs defaultValue="income">
      <TabsList>
        <TabsTrigger value="income">Income</TabsTrigger>
        <TabsTrigger value="profit">Net Income</TabsTrigger>
        <TabsTrigger value="growthRate">Growth Rate</TabsTrigger>
      </TabsList>
      <TabsContent value="income">
        <IncomeSection
          isEmpty={isEmpty}
          accounts={accounts}
          user={user}
          tier={tier}
          value={value}
          defaultValue={defaultValue}
          description={description}
          type="income"
        />
      </TabsContent>
      <TabsContent value="profit">
        <IncomeSection
          isEmpty={isEmpty}
          accounts={accounts}
          user={user}
          tier={tier}
          value={value}
          defaultValue={defaultValue}
          description={description}
          type="profit"
        />
      </TabsContent>
      <TabsContent value="growthRate">
        <IncomeSection
          isEmpty={isEmpty}
          accounts={accounts}
          user={user}
          tier={tier}
          value={value}
          defaultValue={defaultValue}
          description={description}
          type="income"
          enableGrowthRate={true}
        />
      </TabsContent>
    </Tabs>
  );
}