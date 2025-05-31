import { Textarea } from "@midday/ui/textarea";
import { useEffect, useState } from "react";
import { useDebounceValue } from "usehooks-ts";

type Props = {
  defaultValue: string;
  onChange: (value: string | null) => void;
};

export function Note({ defaultValue, onChange }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [debouncedValue] = useDebounceValue(value, 500);

  useEffect(() => {
    if (debouncedValue !== defaultValue) {
      onChange(debouncedValue?.length > 0 ? debouncedValue : null);
    }
  }, [debouncedValue, defaultValue, onChange]);

  return (
    <Textarea
      defaultValue={defaultValue}
      required
      autoFocus
      placeholder="Note"
      className="min-h-[100px] resize-none"
      onChange={(evt) => setValue(evt.target.value)}
    />
  );
}
