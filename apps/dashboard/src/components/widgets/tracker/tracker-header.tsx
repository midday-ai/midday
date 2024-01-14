"use client";

import { useI18n } from "@/locales/client";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";

export function TrackerHeader() {
  const t = useI18n();

  return (
    <div className="flex justify-between">
      <div>
        <h2 className="text-lg">Tracker</h2>
        <span className="text-[#878787]">165h</span>
      </div>

      <div className="flex items-center border rounded-md h-9">
        <Button
          variant="ghost"
          size="icon"
          className="p-0 w-6 h-6 hover:bg-transparent mr-4 ml-2"
        >
          <Icons.ChevronLeft className="w-6 h-6" />
        </Button>
        <span>January</span>
        <Button
          variant="ghost"
          size="icon"
          className="p-0 w-6 h-6 hover:bg-transparent ml-4 mr-2"
        >
          <Icons.ChevronRight className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
