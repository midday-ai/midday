import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { useHotkeys } from "react-hotkeys-hook";

type Props = {
  value: string;
  onChange: (value: string | null) => void;
  onClear?: () => void;
  onArrowDown?: () => void;
};

export function InboxSearch({ value, onChange, onClear, onArrowDown }: Props) {
  useHotkeys("esc", () => onClear?.(), {
    enableOnFormTags: true,
    enabled: Boolean(value),
  });

  return (
    <div className="relative w-full">
      <Icons.Search className="w-[18px] h-[18px] absolute left-2 top-[10px] pointer-events-none" />
      <Input
        placeholder="Search inbox"
        onKeyDown={(evt) => {
          if (evt.key === "ArrowDown") {
            // @ts-ignore
            evt.target?.blur();
            evt.preventDefault();
            onArrowDown?.();
          }
        }}
        className="pl-8"
        value={value}
        onChange={(evt) => {
          const value = evt.target.value;
          onChange(value.length ? value : null);
        }}
      />

      {value && (
        <Icons.Close
          className="w-[18px] h-[18px] top-[9px] absolute right-2"
          onClick={() => onClear?.()}
        />
      )}
    </div>
  );
}
