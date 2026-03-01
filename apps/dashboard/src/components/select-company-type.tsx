import { ComboboxDropdown } from "@midday/ui/combobox-dropdown";
import type { PopoverContent } from "@midday/ui/popover";

const companyTypeOptions = [
  { id: "freelancer", value: "freelancer", label: "Freelancer / Consultant" },
  { id: "solo_founder", value: "solo_founder", label: "Solo founder" },
  { id: "small_team", value: "small_team", label: "2–10 person team" },
  { id: "agency", value: "agency", label: "Agency" },
  { id: "exploring", value: "exploring", label: "Just exploring" },
];

type Props = {
  value?: string;
  onChange: (value: string) => void;
  triggerClassName?: string;
  popoverProps?: React.ComponentProps<typeof PopoverContent>;
  listClassName?: string;
};

export function SelectCompanyType({
  value,
  onChange,
  triggerClassName,
  popoverProps,
  listClassName,
}: Props) {
  const selectedItem = companyTypeOptions.find((item) => item.value === value);

  return (
    <ComboboxDropdown
      placeholder="Select one"
      selectedItem={selectedItem}
      searchPlaceholder="Search"
      items={companyTypeOptions}
      triggerClassName={triggerClassName}
      popoverProps={popoverProps}
      listClassName={listClassName}
      onSelect={(item) => {
        onChange(item.value);
      }}
    />
  );
}
