import { OpenCustomerSheet } from "./open-customer-sheet";
import { SearchField } from "./search-field";

export async function CustomersHeader() {
  return (
    <div className="flex items-center justify-between">
      <SearchField placeholder="Search customers" />

      <div className="hidden sm:block">
        <OpenCustomerSheet />
      </div>
    </div>
  );
}
