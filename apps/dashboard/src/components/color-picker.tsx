import { colors } from "@/utils/categories";
import { cn } from "@midday/ui/cn";
import { useClickAway } from "@uidotdev/usehooks";
import { useState } from "react";
import { HexColorPicker } from "react-colorful";

type Props = {
  value: string;
  onSelect: (value: string) => void;
};

export function ColorPicker({ value, onSelect }: Props) {
  const [isOpen, setOpen] = useState(false);

  const ref = useClickAway(() => {
    setOpen(false);
  });

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="size-3 transition-colors rounded-[2px] absolute top-3 left-2"
        style={{
          backgroundColor: value,
        }}
      />

      <div
        className={cn(
          "position absolute bg-background rounded-sm border border-border p-1 top-10 invisible",
          isOpen && "visible"
        )}
      >
        <HexColorPicker
          className="color-picker"
          color={value}
          onChange={(c) => {
            onSelect(c);
          }}
        />
      </div>
    </div>
  );
}
