"use client";

import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { useQuery } from "@tanstack/react-query";

interface FiscalYearSelectorProps {
  value: number;
  onChange: (year: number) => void;
}

export function FiscalYearSelector({ value, onChange }: FiscalYearSelectorProps) {
  const t = useI18n();
  const trpc = useTRPC();

  const { data: availableYears = [] } = useQuery(
    trpc.taxReports.getAvailableFiscalYears.queryOptions()
  );

  return (
    <Select
      value={value.toString()}
      onValueChange={(val) => onChange(Number.parseInt(val, 10))}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={t("tax_filing.select_year")} />
      </SelectTrigger>
      <SelectContent>
        {availableYears.map((year) => (
          <SelectItem key={year} value={year.toString()}>
            {year}{t("tax_filing.fiscal_year_suffix")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
