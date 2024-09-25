import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { CategorySpendingPortalView } from "@/components/portal-views/category-spending-portal-view";

interface SpendingTabsSectionProps {
  isEmpty: boolean;
  initialPeriod: {
    id: string;
    from: string;
    to: string;
  };
  currency: string;
}

export function SpendingTabsSection({ isEmpty, initialPeriod, currency }: SpendingTabsSectionProps) {
  return (
    <Tabs defaultValue="category" className="w-full mt-6">
      <TabsList className="w-fit flex flex-1 gap-2 rounded-2xl">
        <TabsTrigger value="category">Category</TabsTrigger>
        <TabsTrigger value="merchant">Merchant</TabsTrigger>
        <TabsTrigger value="location">Location</TabsTrigger>
        <TabsTrigger value="payment_channel">Payment Channel</TabsTrigger>
      </TabsList>
      <TabsContent value="category">
        <CategorySpendingPortalView
          disabled={isEmpty}
          period={initialPeriod}
          currency={currency}
          spendingType="category"
        />
      </TabsContent>
      <TabsContent value="merchant">
        <CategorySpendingPortalView
          disabled={isEmpty}
          period={initialPeriod}
          currency={currency}
          spendingType="merchant"
          title="Merchant Spending"
          description="See how you're spending at your favorite merchants."
        />
      </TabsContent>
      <TabsContent value="location">
        <CategorySpendingPortalView
          disabled={isEmpty}
          period={initialPeriod}
          currency={currency}
          spendingType="location"
          title="Location Spending"
          description="See how you're spending at your favorite locations."
        />
      </TabsContent>
      <TabsContent value="payment_channel">
        <CategorySpendingPortalView
          disabled={isEmpty}
          period={initialPeriod}
          currency={currency}
          spendingType="payment_channel"
          title="Payment Channel Spending"
          description="See how you're spending at your favorite payment channels."
        />
      </TabsContent>
    </Tabs>
  );
}