import { NotFoundStatuses } from "./not-found-statuses";
import { StatusWidget } from "./status-widget";

export function NotFoundTerminal() {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-[350px] w-full bg-background">
      <div className="flex h-14 w-full items-center border-b-[1px] border-t-[1px] border-border px-4">
        <span className="loading-ellipsis">Data failed...</span>

        <div className="ml-auto flex space-x-2">
          <StatusWidget />
        </div>
      </div>

      <NotFoundStatuses />
    </div>
  );
}
