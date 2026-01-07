import { CustomersColumnVisibility } from "./customers-column-visibility";
import { OpenCustomerSheet } from "./open-customer-sheet";
import { SearchField } from "./search-field";

export async function CustomersHeader() {
  return (
    <div className="flex items-center justify-between">
      <SearchField placeholder="Search customers" />

      <div className="flex items-center gap-2">
        <CustomersColumnVisibility />
        <div className="hidden sm:block">
          <OpenCustomerSheet />
        </div>
      </div>
    </div>
  );
}
