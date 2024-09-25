import { formatDate } from "@midday/ui/lib/converters/date-formater";
import React from "react";
import { Spending } from "../charts/spending";
import { PortalViewWrapper } from "./portal-view-wrapper";

interface SpendingPortalViewProps {
  disabled: boolean;
  period: Date | string;
  currency: string;
  spendingType?: "category" | "merchant" | "location" | "payment_channel";
  title?: string;
  description?: string;
}

export const CategorySpendingPortalView: React.FC<SpendingPortalViewProps> = ({
  disabled,
  period,
  currency,
  spendingType = "category",
  title = "Spending Across Your Accounts",
  description = "See how you're spending across your accounts and categories.",
}) => {
  return (
    <PortalViewWrapper
      title={title}
      description={description}
      subtitle={``}
      disabled={disabled}
    >
      <Spending
        disabled={disabled}
        initialPeriod={period}
        key="spending"
        currency={currency}
        spendingType={spendingType}
      />
    </PortalViewWrapper>
  );
};
