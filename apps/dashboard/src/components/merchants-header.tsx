import { MerchantsColumnVisibility } from "./merchants-column-visibility";
import { OpenMerchantSheet } from "./open-merchant-sheet";
import { SearchField } from "./search-field";

export async function MerchantsHeader() {
  return (
    <div className="flex items-center justify-between">
      <SearchField placeholder="Search merchants" />

      <div className="flex items-center gap-2">
        <MerchantsColumnVisibility />
        <div className="hidden sm:block">
          <OpenMerchantSheet />
        </div>
      </div>
    </div>
  );
}
