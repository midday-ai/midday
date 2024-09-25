/**
 * @module BankAccountOverviewProTier
 * @description A component that displays an overview of bank and credit accounts for pro-tier users, including connected account summaries and financial account overviews.
 *
 * @component
 * @example
 * ```tsx
 * <BankAccountOverviewProTier
 *   user={userData}
 *   isEmpty={false}
 *   isCurrentUserTierFree={false}
 *   tier={Tier.PRO}
 * />
 * ```
 */

import { EmptyState } from "@/components/charts/empty-state";
import { UpgradeTier } from "@/components/upgrade-tier";
import Tier from "@/config/tier";
import { cn } from "@midday/ui/cn";
import { BankAccountsOverviewSummary } from "@midday/ui/portal/bank-account-portal-view";
import { ConnectedAccountSummary } from "@midday/ui/portal/connected-account-view";
import { CreditAccountsOverviewSummary } from "@midday/ui/portal/credit-account-portal-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";

/**
 * Props for the BankAccountOverviewProTier component
 * @interface BankAccountOverviewProTierProps
 */
interface BankAccountOverviewProTierProps {
    /** User data object */
    user: any; // TODO: Replace 'any' with the actual user type
    /** Flag indicating if the account data is empty */
    isEmpty: boolean;
    /** Flag indicating if the current user is on a free tier */
    isCurrentUserTierFree: boolean;
    /** The user's current tier */
    tier: Tier;
}

/**
 * BankAccountOverviewProTier component
 * 
 * This component provides an overview of bank and credit accounts for pro-tier users, including:
 * - Connected account summary
 * - Bank accounts overview
 * - Credit cards overview
 * 
 * It also handles different states such as empty data and free-tier limitations.
 * 
 * @param {BankAccountOverviewProTierProps} props - The props for the component
 * @returns {JSX.Element} The rendered component
 */
export function BankAccountOverviewProTier({
    user,
    isEmpty,
    isCurrentUserTierFree,
    tier,
}: BankAccountOverviewProTierProps) {
    return (
        <>
            {/* Connected Account Summary Section */}
            <div className={cn((isEmpty || isCurrentUserTierFree) && "mt-8 relative")}>
                {isEmpty && <EmptyState />}
                {isCurrentUserTierFree && <UpgradeTier message="Please upgrade your tier to access detailed financial insights and analytics." />}

                <div className={cn("py-[2%]", (isEmpty || isCurrentUserTierFree) && "blur-[8px] opacity-20")}>
                    <ConnectedAccountSummary
                        name={user?.data?.full_name ?? "Solomon AI User"}
                    />
                </div>
            </div>

            {/* Financial Accounts Overview Section */}
            <div className={cn((isEmpty || isCurrentUserTierFree) && "mt-8 relative")}>
                {isEmpty && <EmptyState />}
                {isCurrentUserTierFree && <UpgradeTier message="Please upgrade your tier to access detailed financial insights and analytics." />}

                <Tabs
                    defaultValue="bank-accounts"
                    className={cn((isEmpty || isCurrentUserTierFree) && "blur-[8px] opacity-20")}
                >
                    <TabsList>
                        <TabsTrigger value="bank-accounts">Bank Accounts</TabsTrigger>
                        <TabsTrigger value="credit-cards">Credit Cards</TabsTrigger>
                    </TabsList>
                    <TabsContent value="bank-accounts">
                        <BankAccountsOverviewSummary
                            financialProfile={undefined}
                            financialContext={undefined}
                            demoMode={true}
                        />
                    </TabsContent>
                    <TabsContent value="credit-cards">
                        <CreditAccountsOverviewSummary
                            financialProfile={undefined}
                            financialContext={undefined}
                            demoMode={true}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}