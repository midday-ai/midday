"use client";

import features from "@/config/enabled-features";
import { Card } from "@midday/ui/card";
import { FinancialPortalOverview } from "@midday/ui/portal/financial-portal-view";
import { HTMLAttributes } from "react";
import { EmptyState } from "../charts/empty-state";

interface FinancialPortalViewProps extends HTMLAttributes<HTMLDivElement> {
  disabled?: boolean;
}
/**
 * FinancialPortalView Component
 *
 * This component renders a financial portal overview if the Analytics V2 feature is enabled.
 * It uses the Card component to wrap the FinancialPortalOverview.
 *
 * @returns {JSX.Element | null} Returns the FinancialPortalOverview wrapped in a Card if Analytics V2 is enabled, otherwise returns null.
 */
export const FinancialPortalView: React.FC<FinancialPortalViewProps> = ({
  disabled,
  ...props
}): JSX.Element | null => {
  // Return null if analytics v2 is not enabled
  if (!features.isAnalyticsV2Enabled) return null;

  return (
    <div className="w-full pt-[3%] mx-auto">
      <Card className="p-[2%]">
        <div className={`mt-8 relative`}>
          {disabled && <EmptyState />}
          <div className={`${disabled && "blur-[8px] opacity-20"}`}>
            <FinancialPortalOverview
              financialProfile={undefined}
              financialContext={undefined}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
