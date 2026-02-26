"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { toast } from "@midday/ui/use-toast";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";

function CurrencyField({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: number | null;
  onChange: (val: number | null) => void;
}) {
  const [display, setDisplay] = useState(value != null ? String(value) : "");

  useEffect(() => {
    setDisplay(value != null ? String(value) : "");
  }, [value]);

  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="relative max-w-[250px]">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          $
        </span>
        <Input
          type="number"
          min={0}
          step={100}
          className="pl-7"
          placeholder="No minimum"
          value={display}
          onChange={(e) => {
            setDisplay(e.target.value);
            const num = Number.parseFloat(e.target.value);
            onChange(Number.isNaN(num) ? null : num);
          }}
        />
      </div>
    </div>
  );
}

function NumberField({
  label,
  description,
  value,
  onChange,
  placeholder,
  suffix,
}: {
  label: string;
  description: string;
  value: number | null;
  onChange: (val: number | null) => void;
  placeholder?: string;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(value != null ? String(value) : "");

  useEffect(() => {
    setDisplay(value != null ? String(value) : "");
  }, [value]);

  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="flex items-center gap-2 max-w-[250px]">
        <Input
          type="number"
          min={0}
          step={1}
          placeholder={placeholder ?? "None"}
          value={display}
          onChange={(e) => {
            setDisplay(e.target.value);
            const num = Number.parseInt(e.target.value, 10);
            onChange(Number.isNaN(num) ? null : num);
          }}
        />
        {suffix && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function UnderwritingBuyBoxSettings() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: buyBox } = useSuspenseQuery(
    trpc.underwriting.getBuyBox.queryOptions(),
  );

  const [minMonthlyRevenue, setMinMonthlyRevenue] = useState<number | null>(
    buyBox?.minMonthlyRevenue ?? null,
  );
  const [minTimeInBusiness, setMinTimeInBusiness] = useState<number | null>(
    buyBox?.minTimeInBusiness ?? null,
  );
  const [maxExistingPositions, setMaxExistingPositions] = useState<
    number | null
  >(buyBox?.maxExistingPositions ?? null);
  const [minAvgDailyBalance, setMinAvgDailyBalance] = useState<number | null>(
    buyBox?.minAvgDailyBalance ?? null,
  );
  const [maxNsfCount, setMaxNsfCount] = useState<number | null>(
    buyBox?.maxNsfCount ?? null,
  );
  const [excludedIndustriesText, setExcludedIndustriesText] = useState(
    (buyBox?.excludedIndustries ?? []).join(", "),
  );
  const [minCreditScore, setMinCreditScore] = useState<number | null>(
    buyBox?.minCreditScore ?? null,
  );

  // Sync local state when data changes
  useEffect(() => {
    if (buyBox) {
      setMinMonthlyRevenue(buyBox.minMonthlyRevenue ?? null);
      setMinTimeInBusiness(buyBox.minTimeInBusiness ?? null);
      setMaxExistingPositions(buyBox.maxExistingPositions ?? null);
      setMinAvgDailyBalance(buyBox.minAvgDailyBalance ?? null);
      setMaxNsfCount(buyBox.maxNsfCount ?? null);
      setExcludedIndustriesText(
        (buyBox.excludedIndustries ?? []).join(", "),
      );
      setMinCreditScore(buyBox.minCreditScore ?? null);
    }
  }, [buyBox]);

  const saveMutation = useMutation(
    trpc.underwriting.saveBuyBox.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.underwriting.getBuyBox.queryKey(),
        });
        toast({
          title: "Saved",
          description: "Buy box criteria updated successfully.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    }),
  );

  const handleSave = () => {
    const excludedIndustries = excludedIndustriesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    saveMutation.mutate({
      minMonthlyRevenue,
      minTimeInBusiness,
      maxExistingPositions,
      minAvgDailyBalance,
      maxNsfCount,
      excludedIndustries: excludedIndustries.length > 0 ? excludedIndustries : null,
      minCreditScore,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buy Box Criteria</CardTitle>
        <CardDescription>
          Define the minimum criteria a merchant must meet to qualify for
          funding. These thresholds are used during automated scoring to flag
          deals that fall outside your parameters.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid gap-6 sm:grid-cols-2">
          <CurrencyField
            label="Min Monthly Revenue"
            description="Minimum average monthly revenue from bank statements"
            value={minMonthlyRevenue}
            onChange={setMinMonthlyRevenue}
          />

          <NumberField
            label="Min Time in Business"
            description="Minimum months the business has been operating"
            value={minTimeInBusiness}
            onChange={setMinTimeInBusiness}
            suffix="months"
          />

          <NumberField
            label="Max Existing Positions"
            description="Maximum number of concurrent MCA positions allowed"
            value={maxExistingPositions}
            onChange={setMaxExistingPositions}
          />

          <CurrencyField
            label="Min Avg Daily Balance"
            description="Minimum average daily bank balance"
            value={minAvgDailyBalance}
            onChange={setMinAvgDailyBalance}
          />

          <NumberField
            label="Max NSF Count"
            description="Maximum non-sufficient funds in the review period"
            value={maxNsfCount}
            onChange={setMaxNsfCount}
          />

          <NumberField
            label="Min Credit Score"
            description="Minimum FICO credit score required"
            value={minCreditScore}
            onChange={setMinCreditScore}
          />

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-sm">Excluded Industries</Label>
            <p className="text-xs text-muted-foreground">
              Industries you will not fund. Separate with commas.
            </p>
            <Input
              placeholder="e.g. Gambling, Cannabis, Firearms"
              className="max-w-[500px]"
              value={excludedIndustriesText}
              onChange={(e) => setExcludedIndustriesText(e.target.value)}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <p className="text-xs text-muted-foreground">
          Leave a field blank to skip that criterion during scoring.
        </p>
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </CardFooter>
    </Card>
  );
}
