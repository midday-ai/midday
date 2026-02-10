"use client";

import { useArtifact } from "@ai-sdk-tools/artifacts/client";
import { taxSummaryArtifact } from "@api/ai/artifacts/tax-summary";
import { getDefaultTaxType } from "@midday/utils";
import { parseAsInteger, useQueryState } from "nuqs";
import {
  BaseCanvas,
  CanvasChart,
  CanvasGrid,
  CanvasHeader,
  CanvasSection,
} from "@/components/canvas/base";
import { CanvasContent } from "@/components/canvas/base/canvas-content";
import {
  formatCurrencyAmount,
  shouldShowChart,
  shouldShowMetricsSkeleton,
  shouldShowSummarySkeleton,
} from "@/components/canvas/utils";
import { CategoryExpenseDonutChart } from "@/components/charts/category-expense-donut-chart";
import { useTeamQuery } from "@/hooks/use-team";
import { useUserQuery } from "@/hooks/use-user";
import { useI18n } from "@/locales/client";

function getTaxTerminology(
  countryCode: string | undefined,
  t: ReturnType<typeof useI18n>,
): {
  title: string;
  typeName: string;
  liability: string;
  paid: string;
  rate: string;
  rateSubtitle: string;
  category: string;
  previousPeriod: string;
} {
  if (!countryCode) {
    return {
      title: t("tax_summary.title.default"),
      typeName: "Tax",
      liability: "Total Tax Liability",
      paid: "Total tax paid",
      rate: "Effective Tax Rate",
      rateSubtitle: "Tax as % of taxable income",
      category: "Top Tax Category",
      previousPeriod: "Previous Period Tax",
    };
  }

  const taxType = getDefaultTaxType(countryCode);

  // Map tax type to i18n key
  const typeKey =
    taxType === "vat" || taxType === "gst" || taxType === "sales_tax"
      ? taxType
      : "default";

  const title = t(`tax_summary.title.${typeKey}` as "tax_summary.title.vat");

  // Extract tax type name from title (e.g., "VAT Summary" -> "VAT")
  const typeName =
    typeKey === "default" ? "Tax" : title.replace(" Summary", "");

  // Get paid label from i18n
  const paidLabel = t(`tax_summary.paid.${typeKey}` as "tax_summary.paid.vat");

  return {
    title,
    typeName,
    liability: `Total ${typeName} Liability`,
    paid: `Total ${paidLabel}`,
    rate: `Effective ${typeName} Rate`,
    rateSubtitle: `${typeName} as % of taxable income`,
    category: `Top ${typeName} Category`,
    previousPeriod: `Previous Period ${typeName}`,
  };
}

export function TaxSummaryCanvas() {
  const [version] = useQueryState("version", parseAsInteger.withDefault(0));
  const [artifact] = useArtifact(taxSummaryArtifact, { version });
  const { data, status } = artifact;
  const { data: user } = useUserQuery();
  const _isLoading = status === "loading";
  const stage = data?.stage;
  const currency = data?.currency || "USD";
  const locale = user?.locale ?? undefined;
  const { data: team } = useTeamQuery();
  const t = useI18n();
  const taxTerms = getTaxTerminology(team?.countryCode ?? undefined, t);

  const categoryData = data?.chart?.categoryData || [];
  const metrics = data?.metrics;

  // Prepare category data for donut chart (convert to expected format)
  const donutChartData = categoryData.map((item) => ({
    category: item.category,
    amount: item.taxAmount,
    percentage: item.percentage,
  }));

  // Prepare metrics cards
  const taxMetrics: Array<{
    id: string;
    title: string;
    value: string;
    subtitle: string;
  }> = [
    {
      id: "total-tax-liability",
      title: taxTerms.liability,
      value: formatCurrencyAmount(
        metrics?.totalTaxLiability || 0,
        currency,
        locale,
      ),
      subtitle: taxTerms.paid,
    },
    {
      id: "total-taxable-income",
      title: "Total Taxable Income",
      value: formatCurrencyAmount(
        metrics?.totalTaxableIncome || 0,
        currency,
        locale,
      ),
      subtitle: "Income subject to tax",
    },
    {
      id: "effective-tax-rate",
      title: taxTerms.rate,
      value: `${(metrics?.effectiveTaxRate || 0).toFixed(2)}%`,
      subtitle: taxTerms.rateSubtitle,
    },
    {
      id: "top-tax-category",
      title: taxTerms.category,
      value: metrics?.topCategories?.[0]?.category || "N/A",
      subtitle: metrics?.topCategories?.[0]
        ? `${formatCurrencyAmount(
            metrics.topCategories[0].taxAmount,
            currency,
            locale,
          )} (${metrics.topCategories[0].percentage.toFixed(1)}%)`
        : "No data",
    },
  ];

  // Add previous period comparison if available
  if (metrics?.previousPeriod) {
    taxMetrics.push({
      id: "previous-period-tax",
      title: taxTerms.previousPeriod,
      value: formatCurrencyAmount(
        metrics.previousPeriod.totalTaxLiability,
        currency,
        locale,
      ),
      subtitle: "For comparison",
    });
  }

  const showChart = shouldShowChart(stage);
  const showSummarySkeleton = shouldShowSummarySkeleton(stage);

  return (
    <BaseCanvas>
      <CanvasHeader title={taxTerms.title} />

      <CanvasContent>
        <div className="space-y-8">
          {/* Tax by Category Donut Chart */}
          {showChart && donutChartData.length > 0 && (
            <CanvasChart
              title={`${taxTerms.typeName} by Category`}
              isLoading={stage === "loading"}
              height="20rem"
            >
              <CategoryExpenseDonutChart
                data={donutChartData}
                currency={currency}
                locale={locale}
                height={320}
              />
            </CanvasChart>
          )}

          {/* Metrics Grid */}
          <CanvasGrid
            items={taxMetrics}
            layout="2/2"
            isLoading={shouldShowMetricsSkeleton(stage)}
          />

          {/* Summary Section */}
          <CanvasSection title="Summary" isLoading={showSummarySkeleton}>
            {data?.analysis?.summary}
          </CanvasSection>
        </div>
      </CanvasContent>
    </BaseCanvas>
  );
}
