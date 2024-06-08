import { NotFoundStatuses } from "./not-found-statuses";
import { StatusWidget } from "./status-widget";

export function NotFoundTerminal() {
  return (
    <div className="h-[350px] w-full bg-background fixed left-0 right-0 bottom-0">
      <div className="border-t-[1px] border-b-[1px] border-border w-full h-14 px-4 flex items-center">
        <span className="loading-ellipsis">Data failed...</span>

        <div className="flex space-x-2 ml-auto">
          <StatusWidget />
        </div>
      </div>

      <NotFoundStatuses />
    </div>
  );
}
