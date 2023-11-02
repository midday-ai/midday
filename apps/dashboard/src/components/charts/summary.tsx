import { Icons } from "@midday/ui/icons";

export function Summary() {
  return (
    <div className="flex justify-between pb-14 items-end">
      <div>
        <div className="flex space-x-2 items-center mb-2">
          <h2 className="text-md">Revenue</h2>
          <Icons.ChevronDown />
        </div>
        <h1 className="text-3xl mb-1">€437,109.45</h1>

        <p className="text-sm text-[#606060]">vs $3,437,152.32 last period</p>
      </div>

      <div className="flex space-x-4">
        <div className="flex space-x-2 items-center">
          <span className="w-2 h-2 rounded-full bg-[#F5F5F3]" />
          <span className="text-sm text-[#606060]">Chosen Period</span>
        </div>
        <div className="flex space-x-2 items-center">
          <span className="w-2 h-2 rounded-full bg-[#606060]" />
          <span className="text-sm text-[#606060]">Last Period</span>
        </div>
      </div>
    </div>
  );
}
