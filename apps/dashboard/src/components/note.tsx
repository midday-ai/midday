import { Textarea } from "@midday/ui/textarea";
import { useState } from "react";

type Props = {
  defaultValue: string;
  onChange: (value: string | null) => void;
};

export function Note({ defaultValue, onChange }: Props) {
  const [value, setValue] = useState(defaultValue);

  return (
    <Textarea
      defaultValue={defaultValue}
      required
      autoFocus
      placeholder="Note"
      className="min-h-[100px] resize-none"
      onBlur={() => {
        if (value !== defaultValue) {
          onChange(value?.length > 0 ? value : null);
        }
      }}
      onChange={(evt) => setValue(evt.target.value)}
    />
  );
}
