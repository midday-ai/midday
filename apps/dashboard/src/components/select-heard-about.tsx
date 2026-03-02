import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";

const heardAboutOptions = [
  { value: "twitter", label: "Twitter / X" },
  { value: "youtube", label: "YouTube" },
  { value: "friend", label: "Friend or colleague" },
  { value: "google", label: "Google Search" },
  { value: "blog", label: "Blog or article" },
  { value: "podcast", label: "Podcast" },
  { value: "github", label: "GitHub" },
  { value: "other", label: "Other" },
];

type Props = {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
};

export function SelectHeardAbout({ value, onChange, className }: Props) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select one" />
      </SelectTrigger>
      <SelectContent>
        {heardAboutOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
