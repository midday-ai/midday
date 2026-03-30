import { apps as officialApps } from "@midday/app-store";
import { connectorApps } from "@midday/connectors";
import { AppsTabs } from "./apps-tabs";
import { SearchField } from "./search-field";

const totalApps =
  officialApps.length + connectorApps.filter((c) => c.active).length;

export function AppsHeader() {
  return (
    <div className="flex space-x-4">
      <AppsTabs />
      <SearchField placeholder={`Search ${totalApps} apps`} shallow />
    </div>
  );
}
