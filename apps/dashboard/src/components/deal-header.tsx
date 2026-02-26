import { DealSearchFilter } from "@/components/deal-search-filter";
import { DealColumnVisibility } from "./deal-column-visibility";
import { OpenDealSheet } from "./open-deal-sheet";

export function DealHeader() {
  return (
    <div className="flex items-center justify-between">
      <DealSearchFilter />

      <div className="hidden sm:flex space-x-2">
        <DealColumnVisibility />
        <OpenDealSheet />
      </div>
    </div>
  );
}
