"use client";

import { Slider } from "@midday/ui/slider";

export default function AmountRange() {
  return (
    <div className="bg-background text-popover-foreground shadow-lg w-[250px] p-4">
      <Slider defaultValue={[50]} max={100} step={1} />
    </div>
  );
}
