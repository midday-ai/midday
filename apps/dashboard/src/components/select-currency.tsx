import { ComboboxDropdown } from "@midday/ui/combobox-dropdown";

type Props = {
  value?: string;
  headless?: boolean;
  className?: string;
  triggerClassName?: string;
  currencies: string[];
  onChange: (value: string) => void;
};

export function SelectCurrency({
  currencies,
  value,
  onChange,
  headless,
  className,
  triggerClassName,
}: Props) {
  const data = currencies?.map((currency) => ({
    id: currency.toLowerCase(),
    value: currency.toUpperCase(),
    label: currency,
  }));

  return (
    <ComboboxDropdown
      headless={headless}
      placeholder="Select currency"
      selectedItem={data?.find((item) => item.id === value?.toLowerCase())}
      searchPlaceholder="Search currencies"
      items={data}
      className={className}
      triggerClassName={triggerClassName}
      onSelect={(item) => {
        onChange(item.value);
      }}
    />
  );
}
