import { ComboboxDropdown } from "@midday/ui/combobox-dropdown";
import type { PopoverContent } from "@midday/ui/popover";
import { getFiscalYearLabel } from "@midday/utils";

type Props = {
  value?: number | null;
  onChange: (value: number | null) => void;
  className?: string;
  triggerClassName?: string;
  headless?: boolean;
  popoverProps?: React.ComponentProps<typeof PopoverContent>;
  listClassName?: string;
};

const fiscalMonthOptions = [
  { id: "null", value: null, label: "Trailing 12 months (default)" },
  { id: "1", value: 1, label: `${getFiscalYearLabel(1)} (Calendar year)` },
  { id: "2", value: 2, label: getFiscalYearLabel(2) },
  { id: "3", value: 3, label: getFiscalYearLabel(3) },
  { id: "4", value: 4, label: getFiscalYearLabel(4) },
  { id: "5", value: 5, label: getFiscalYearLabel(5) },
  { id: "6", value: 6, label: getFiscalYearLabel(6) },
  { id: "7", value: 7, label: getFiscalYearLabel(7) },
  { id: "8", value: 8, label: getFiscalYearLabel(8) },
  { id: "9", value: 9, label: getFiscalYearLabel(9) },
  { id: "10", value: 10, label: getFiscalYearLabel(10) },
  { id: "11", value: 11, label: getFiscalYearLabel(11) },
  { id: "12", value: 12, label: getFiscalYearLabel(12) },
];

export function SelectFiscalMonth({
  value,
  onChange,
  className,
  triggerClassName,
  headless,
  popoverProps,
  listClassName,
}: Props) {
  const selectedItem = fiscalMonthOptions.find(
    (item) => item.value === value || (item.value === null && value === null),
  );

  return (
    <ComboboxDropdown
      headless={headless}
      placeholder="Select fiscal year start"
      selectedItem={selectedItem}
      searchPlaceholder="Search months"
      items={fiscalMonthOptions}
      className={className}
      triggerClassName={triggerClassName}
      popoverProps={popoverProps}
      listClassName={listClassName}
      onSelect={(item) => {
        onChange(item.value);
      }}
    />
  );
}
