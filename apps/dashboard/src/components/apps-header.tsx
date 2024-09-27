import { AppsTabs } from "./apps-tabs";
import { SearchField } from "./search-field";

export function AppsHeader() {
  return (
    <div className="flex space-x-4">
      <AppsTabs />
      <SearchField placeholder="Search apps" shallow />
    </div>
  );
}
