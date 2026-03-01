import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";

const companyTypeOptions = [
  { value: "freelancer", label: "Freelancer / Consultant" },
  { value: "solo_founder", label: "Solo founder" },
  { value: "small_team", label: "2–10 person team" },
  { value: "agency", label: "Agency" },
  { value: "exploring", label: "Just exploring" },
];

type Props = {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
};

export function SelectCompanyType({ value, onChange, className }: Props) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select one" />
      </SelectTrigger>
      <SelectContent>
        {companyTypeOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
