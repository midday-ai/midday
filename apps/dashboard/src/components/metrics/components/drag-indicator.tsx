import { Icons } from "@midday/ui/icons";

export function DragIndicator() {
  return (
    <div className="h-7 px-2 inline-flex items-center justify-center border border-border text-[#666] cursor-grab active:cursor-grabbing">
      <Icons.DragIndicator size={12} />
    </div>
  );
}
