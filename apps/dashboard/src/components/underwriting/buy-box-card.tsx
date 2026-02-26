"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { BuyBoxCriteria } from "./mock-analysis";

export function BuyBoxCard({
  onCriteriaChange,
}: {
  onCriteriaChange: (criteria: BuyBoxCriteria) => void;
}) {
  const trpc = useTRPC();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: savedBuyBox } = useQuery(
    trpc.underwriting.getBuyBox.queryOptions(),
  );

  const [minMonthlyRevenue, setMinMonthlyRevenue] = useState("");
  const [minTimeInBusiness, setMinTimeInBusiness] = useState("");
  const [maxExistingPositions, setMaxExistingPositions] = useState("");
  const [minAvgDailyBalance, setMinAvgDailyBalance] = useState("");
  const [maxNsfCount, setMaxNsfCount] = useState("");
  const [minCreditScore, setMinCreditScore] = useState("");
  const [excludedIndustries, setExcludedIndustries] = useState("");

  // Populate form from saved data
  useEffect(() => {
    if (savedBuyBox) {
      setMinMonthlyRevenue(
        savedBuyBox.minMonthlyRevenue?.toString() ?? "",
      );
      setMinTimeInBusiness(
        savedBuyBox.minTimeInBusiness?.toString() ?? "",
      );
      setMaxExistingPositions(
        savedBuyBox.maxExistingPositions?.toString() ?? "",
      );
      setMinAvgDailyBalance(
        savedBuyBox.minAvgDailyBalance?.toString() ?? "",
      );
      setMaxNsfCount(savedBuyBox.maxNsfCount?.toString() ?? "");
      setMinCreditScore(savedBuyBox.minCreditScore?.toString() ?? "");
      setExcludedIndustries(
        savedBuyBox.excludedIndustries?.join(", ") ?? "",
      );
    }
  }, [savedBuyBox]);

  // Sync criteria to parent whenever form values change
  useEffect(() => {
    const criteria = buildCriteria();
    onCriteriaChange(criteria);
  }, [
    minMonthlyRevenue,
    minTimeInBusiness,
    maxExistingPositions,
    minAvgDailyBalance,
    maxNsfCount,
    minCreditScore,
    excludedIndustries,
  ]);

  const saveMutation = useMutation(
    trpc.underwriting.saveBuyBox.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.underwriting.getBuyBox.queryKey(),
        });
        toast({ title: "Buy box saved", duration: 2000 });
      },
      onError: () => {
        toast({
          title: "Failed to save",
          variant: "destructive",
          duration: 3000,
        });
      },
    }),
  );

  function buildCriteria(): BuyBoxCriteria {
    return {
      minMonthlyRevenue: minMonthlyRevenue
        ? Number(minMonthlyRevenue)
        : null,
      minTimeInBusiness: minTimeInBusiness
        ? Number(minTimeInBusiness)
        : null,
      maxExistingPositions: maxExistingPositions
        ? Number(maxExistingPositions)
        : null,
      minAvgDailyBalance: minAvgDailyBalance
        ? Number(minAvgDailyBalance)
        : null,
      maxNsfCount: maxNsfCount ? Number(maxNsfCount) : null,
      minCreditScore: minCreditScore ? Number(minCreditScore) : null,
      excludedIndustries: excludedIndustries
        ? excludedIndustries
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : null,
    };
  }

  function handleSave() {
    saveMutation.mutate(buildCriteria());
  }

  return (
    <div className="border border-border p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-medium">Buy Box Criteria</h2>
          <p className="text-[12px] text-[#606060] mt-0.5">
            Define the minimum thresholds for deals you will accept
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <Field
          label="Min Monthly Revenue"
          hint="Minimum average monthly deposits"
          value={minMonthlyRevenue}
          onChange={setMinMonthlyRevenue}
          prefix="$"
          placeholder="10000"
        />
        <Field
          label="Min Time in Business"
          hint="Minimum months in operation"
          value={minTimeInBusiness}
          onChange={setMinTimeInBusiness}
          suffix="months"
          placeholder="24"
        />
        <Field
          label="Max Existing Positions"
          hint="Maximum stacked MCAs allowed"
          value={maxExistingPositions}
          onChange={setMaxExistingPositions}
          placeholder="2"
        />
        <Field
          label="Min Avg Daily Balance"
          hint="Minimum average daily bank balance"
          value={minAvgDailyBalance}
          onChange={setMinAvgDailyBalance}
          prefix="$"
          placeholder="5000"
        />
        <Field
          label="Max NSFs (Statement Period)"
          hint="Maximum NSFs across all statements"
          value={maxNsfCount}
          onChange={setMaxNsfCount}
          placeholder="3"
        />
        <Field
          label="Min Credit Score"
          hint="Optional minimum estimated score"
          value={minCreditScore}
          onChange={setMinCreditScore}
          placeholder="600"
        />
      </div>

      <div className="mt-4">
        <label className="text-xs text-[#878787] font-normal">
          Excluded Industries
        </label>
        <p className="text-[11px] text-[#606060] mb-1.5">
          Comma-separated list of industries to decline
        </p>
        <Input
          value={excludedIndustries}
          onChange={(e) => setExcludedIndustries(e.target.value)}
          placeholder="Restaurant, Cannabis, Gambling"
        />
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs text-[#878787] font-normal">{label}</label>
      <p className="text-[11px] text-[#606060] mb-1.5">{hint}</p>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#606060]">
            {prefix}
          </span>
        )}
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={prefix ? "pl-7" : ""}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#606060]">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
