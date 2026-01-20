"use client";

import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@midday/ui/use-toast";
import { useState } from "react";
import { BalanceSheetView } from "./balance-sheet-view";
import { ConsumptionTaxView } from "./consumption-tax-view";
import { ExpenseBreakdownView } from "./expense-breakdown-view";
import { ExportModal } from "./export-modal";
import { FiscalYearSelector } from "./fiscal-year-selector";
import { IncomeStatementView } from "./income-statement-view";
import { MonthlyChart } from "./monthly-chart";
import { WithholdingTaxView } from "./withholding-tax-view";

export function TaxFilingPage() {
  const t = useI18n();
  const trpc = useTRPC();
  const currentYear = new Date().getFullYear();
  const [fiscalYear, setFiscalYear] = useState(currentYear - 1);

  const { data, isLoading } = useQuery(
    trpc.taxReports.getTaxFilingData.queryOptions({
      fiscalYear,
      reportType: "blue_return",
    })
  );

  const handleExport = async (format: string, reportType: string) => {
    if (!data) {
      toast({
        duration: 3500,
        variant: "error",
        title: t("tax_filing.empty.no_data"),
      });
      return;
    }

    try {
      // Select the appropriate data based on report type
      let exportData: unknown;
      let fileName: string;

      switch (reportType) {
        case "income_statement":
          exportData = data.incomeStatement;
          fileName = `income-statement-${fiscalYear}`;
          break;
        case "balance_sheet":
          exportData = data.balanceSheet;
          fileName = `balance-sheet-${fiscalYear}`;
          break;
        case "consumption_tax":
          exportData = data.consumptionTax;
          fileName = `consumption-tax-${fiscalYear}`;
          break;
        case "withholding_tax":
          exportData = data.withholdingTax;
          fileName = `withholding-tax-${fiscalYear}`;
          break;
        case "full_report":
        default:
          exportData = data;
          fileName = `tax-filing-${fiscalYear}`;
          break;
      }

      // Generate file content
      const content = JSON.stringify(exportData, null, 2);
      const mimeType = format === "csv" ? "text/csv" : "application/json";
      const extension = format === "csv" ? "csv" : "json";

      // Create download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        duration: 2500,
        variant: "success",
        title: t("tax_filing.export.success"),
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        duration: 3500,
        variant: "error",
        title: t("tax_filing.export.error"),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("tax_filing.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("tax_filing.description")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <FiscalYearSelector value={fiscalYear} onChange={setFiscalYear} />
          <ExportModal fiscalYear={fiscalYear} onExport={handleExport} />
        </div>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            {t("tax_filing.sections.income_statement")}
          </TabsTrigger>
          <TabsTrigger value="balance">
            {t("tax_filing.sections.balance_sheet")}
          </TabsTrigger>
          <TabsTrigger value="expenses">
            {t("tax_filing.sections.expense_breakdown")}
          </TabsTrigger>
          <TabsTrigger value="consumption">
            {t("tax_filing.sections.consumption_tax")}
          </TabsTrigger>
          <TabsTrigger value="withholding">
            {t("tax_filing.sections.withholding_tax")}
          </TabsTrigger>
          <TabsTrigger value="monthly">
            {t("tax_filing.sections.monthly_breakdown")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <IncomeStatementView
            data={data?.incomeStatement}
            isLoading={isLoading}
            currency="JPY"
          />
        </TabsContent>

        <TabsContent value="balance" className="space-y-6">
          <BalanceSheetView
            data={data?.balanceSheet}
            isLoading={isLoading}
            currency="JPY"
          />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <ExpenseBreakdownView
            data={data?.expenseByCategory}
            isLoading={isLoading}
            currency="JPY"
          />
        </TabsContent>

        <TabsContent value="consumption" className="space-y-6">
          <ConsumptionTaxView
            data={data?.consumptionTax}
            isLoading={isLoading}
            currency="JPY"
          />
        </TabsContent>

        <TabsContent value="withholding" className="space-y-6">
          <WithholdingTaxView
            data={data?.withholdingTax}
            isLoading={isLoading}
            currency="JPY"
          />
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
          <MonthlyChart
            data={data?.monthlyBreakdown}
            isLoading={isLoading}
            currency="JPY"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
