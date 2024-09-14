import { CaretSortIcon } from "@radix-ui/react-icons";
import { RocketIcon, Wallet2Icon } from "lucide-react";
import React, { createContext, ReactNode } from "react";
import {
  AccountBalanceHistory,
  Apr,
  CreditAccount,
  FinancialProfile,
} from "solomon-ai-typescript-sdk";
import { FinancialDataGenerator } from "../../../lib/random/financial-data-generator";
import { cn } from "../../../utils/cn";
import { AccountBalanceChart } from "../../charts/financials/account-balance";

import { Badge } from "../../badge";
import { Button } from "../../button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../collapsible";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../../hover-card";
import { Label } from "../../label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../tabs";

import { FinancialDataProcessor } from "../../../lib/financial-data-processor";

/** @type {React.Context<CreditAccount>} */
const CreditAccountCardContext = createContext<CreditAccount>({});
const FinancialProfileContext = createContext<FinancialProfile>({});

/**
 * Credit Account Card Props
 *
 * @export
 * @typedef {CreditAccountCardProps}
 * @template CreditAccount
 */
export type CreditAccountCardProps<CreditAccount> = {
  creditAccount: CreditAccount;
  financialProfile: FinancialProfile;
  institutionName: string;
  className?: string;
  contextQuestions?: string[];
  enableDemoMode?: boolean;
  children?: ReactNode;
  historicalAccountBalance?: AccountBalanceHistory[];
};

/**
 * Credit Account Card Component that displays the credit account information
 *
 * @param {{ creditAccount: any; financialProfile: any; institutionName: any; className: any; contextQuestions: any; enableDemoMode: any; children: any; historicalAccountBalance: any; }} param0
 * @param {*} param0.creditAccount
 * @param {*} param0.financialProfile
 * @param {*} param0.institutionName
 * @param {*} param0.className
 * @param {*} param0.contextQuestions
 * @param {*} param0.enableDemoMode
 * @param {*} param0.children
 * @param {*} param0.historicalAccountBalance
 * @returns {*}
 */
export const CreditAccountCard: React.FC<
  CreditAccountCardProps<CreditAccount>
> = ({
  creditAccount,
  financialProfile,
  institutionName,
  className,
  enableDemoMode,
  children,
  historicalAccountBalance,
}) => {
    creditAccount = enableDemoMode
      ? FinancialDataGenerator.generateRandomCreditAccount()
      : creditAccount;

    return (
      <CreditAccountCardContext.Provider value={creditAccount}>
        <FinancialProfileContext.Provider value={financialProfile}>
          <div className={cn("p-2", className)}>
            <CardHeader className="flex items-start gap-x-5 space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-xs font-bold text-gray-600 dark:text-gray-200">
                  $
                  {FinancialDataProcessor.formatNumber(
                    creditAccount.currentFunds ?? 0,
                    2,
                  )}
                </CardTitle>
                <CardTitle
                  className="text-xs font-bold"
                  style={{
                    fontSize: "11px",
                  }}
                >
                  <HoverCard>
                    <HoverCardTrigger>
                      {" "}
                      {institutionName} Credit Card
                    </HoverCardTrigger>
                    <HoverCardContent className="rounded-2xl">
                      <CreditAccountMiniCard
                        creditAccount={creditAccount}
                        institutionName={institutionName}
                        className="border-0 shadow-none"
                      />
                    </HoverCardContent>
                  </HoverCard>
                </CardTitle>
                <div>
                  <div className="flex flex-1 justify-start gap-2">
                    <Badge
                      className="border border-black bg-white font-bold text-background"
                      style={{
                        fontSize: "8px",
                      }}
                    >
                      {creditAccount.type}
                    </Badge>
                    <Badge
                      className="border border-black bg-white text-background"
                      style={{
                        fontSize: "8px",
                      }}
                    >
                      Overdue: {creditAccount.isOverdue === false ? "No" : "Yes"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="flex gap-1">
                    <span className="text-xs text-gray-600 dark:text-gray-200">
                      Account Number:{" "}
                    </span>
                    <span className="text-xs font-bold">
                      {creditAccount.number}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-2xl font-bold">
                    Currently owe: $
                    {FinancialDataProcessor.formatNumber(
                      creditAccount.balance ?? 0,
                      2,
                    )}
                  </Label>
                  <p
                    style={{
                      fontSize: "10px",
                    }}
                    className="font-bold"
                  >
                    Card balance limit ${creditAccount.balanceLimit}
                  </p>
                  <p
                    style={{
                      fontSize: "10px",
                    }}
                    className="font-bold"
                  >
                    $
                    {FinancialDataProcessor.formatNumber(
                      creditAccount.minimumPaymentAmount ?? 0,
                      2,
                    )}{" "}
                    due on{" "}
                    {FinancialDataProcessor.formatDate(
                      creditAccount.nextPaymentDueDate ?? 0,
                    )}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="details" className="min-w-[400px]">
                <TabsList className="py-2 font-bold">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  {creditAccount.aprs && creditAccount.aprs.length > 0 && (
                    <TabsTrigger value="apr">Apr</TabsTrigger>
                  )}
                </TabsList>
                <TabsContent value="details">
                  <CreditCardCollapsibleDetails
                    creditAccount={creditAccount}
                    className="py-2"
                  />
                </TabsContent>
                {creditAccount.aprs && creditAccount.aprs.length > 0 && (
                  <TabsContent value="apr">
                    <CreditAccountApr aprs={creditAccount.aprs} />
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
            <CardFooter>
              <AccountBalanceChart
                data={historicalAccountBalance ?? []}
                currency="USD"
              />
            </CardFooter>
            {children}
          </div>
        </FinancialProfileContext.Provider>
      </CreditAccountCardContext.Provider>
    );
  };

/*
 * Credit Account Apr Props
 *
 * @interface CreditAccountAprProps
 * */
interface CreditAccountAprProps {
  aprs: Apr[];
}

/**
 * Credit Account Apr Component that displays the credit account apr information
 *
 * @param {*} props
 * @returns {*}
 */
const CreditAccountApr: React.FC<CreditAccountAprProps> = (props) => {
  const { aprs } = props;

  return (
    <div>
      <Card className="flex flex-col gap-3 rounded-lg p-3">
        <div>
          <div className="flex flex-row gap-2">
            <RocketIcon className="h-4 w-4" />
            <p className="text-xs font-bold"> Card Aprs </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {aprs.map((apr, idx) => (
            <div className="flex flex-col" key={idx}>
              <div key={idx} className="flex flex-row gap-3">
                <p className="text-xs font-bold">
                  {apr.type &&
                    FinancialDataProcessor.removeUnderScores(apr.type)}
                </p>
                <p className="text-xs font-bold">{apr.percentage}%</p>
              </div>
              <p className="text-xs">
                {apr.balanceSubjectToApr}
                <span className="text-xs"> of balance subject to apr</span>
              </p>
            </div>
          ))}{" "}
        </div>
      </Card>
    </div>
  );
};

/*
 * Credit Account Mini Card Props
 *
 * @interface CreditAccountMiniCardProps
 * */
interface CreditAccountMiniCardProps {
  creditAccount: CreditAccount;
  institutionName: string;
  className?: string;
}

/**
 * Credit Account Mini Card Component that displays the credit account mini card information
 *
 * @param {*} props
 * @returns {*}
 */
const CreditAccountMiniCard: React.FC<CreditAccountMiniCardProps> = (props) => {
  const { creditAccount, institutionName, className } = props;
  return (
    <Card
      className={cn(
        "flex flex-col space-x-1 rounded-2xl bg-white text-secondary-foreground",
        className,
      )}
    >
      <CardHeader>
        <div className="flex flex-1 justify-between">
          <p className="font-bold">{institutionName.toUpperCase()}</p>
          <div>
            <Wallet2Icon className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center">
          <p className="text-xl font-bold">
            ${creditAccount.balance}{" "}
            <span className="text-xs">current balance</span>
          </p>
          <p className="text-md font-bold">
            ${creditAccount.minimumPaymentAmount}
            <span className="ml-2 text-xs">
              due on {creditAccount.nextPaymentDueDate}{" "}
            </span>
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <div className="item-end flex flex-col justify-end">
          <p className="text-sm">{creditAccount.number} </p>
          <p className="text-xs">Account Number</p>
        </div>
      </CardFooter>
    </Card>
  );
};

/*
 * Credit Card Collapsible Details Props
 *
 * @interface CreditCardCollapsibleDetailsProps
 * */
interface CreditCardCollapsibleDetailsProps {
  creditAccount: CreditAccount;
  className?: string;
}

/**
 * Credit Card Collapsible Details Component that displays the credit card collapsible details information
 * @param {*} props
 * @returns {*}
 */
const CreditCardCollapsibleDetails: React.FC<
  CreditCardCollapsibleDetailsProps
> = (props) => {
  const { creditAccount, className } = props;
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn("w-[350px] space-y-2", className)}
    >
      <div className="flex items-center justify-between space-x-4 px-4">
        <h4 className="text-sm font-semibold">{creditAccount.name} details</h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            <CaretSortIcon className="h-4 w-4" />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
        <div className="items-between flex flex-row justify-between">
          <p className="text-xs"> Last Payed</p>
          <p className="text-xs">
            {" "}
            {FinancialDataProcessor.formatDate(
              creditAccount.lastPaymentDate ?? "",
            )}{" "}
          </p>
        </div>
      </div>
      <CollapsibleContent className="space-y-2">
        <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
          <div className="items-between flex flex-row justify-between">
            <p className="text-xs"> Last Issued</p>
            <p className="text-xs">
              {" "}
              {FinancialDataProcessor.formatDate(
                creditAccount.lastStatementIssueDate ?? "",
              )}{" "}
            </p>
          </div>
        </div>
        <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
          <div className="items-between flex flex-row justify-between">
            <p className="text-xs"> Last Statement Balance</p>
            <p className="text-xs">
              {" "}
              $
              {FinancialDataProcessor.formatNumber(
                creditAccount.lastStatementBalance ?? 0,
                2,
              )}{" "}
            </p>
          </div>
        </div>
        <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
          <div className="items-between flex flex-row justify-between">
            <p className="text-xs"> Last Payment Amount</p>
            <p className="text-xs">
              {" "}
              $
              {FinancialDataProcessor.formatNumber(
                creditAccount.lastPaymentAmount ?? 0,
                2,
              )}{" "}
            </p>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export { CreditAccountMiniCard };
