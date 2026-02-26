import { DueDate } from "./due-date";
import { DealNo } from "./deal-no";
import { DealTitle } from "./deal-title";
import { IssueDate } from "./issue-date";

export function Meta() {
  return (
    <div>
      <DealTitle />

      <div className="flex flex-col gap-0.5">
        <div>
          <DealNo />
        </div>
        <div>
          <IssueDate />
        </div>
        <div>
          <DueDate />
        </div>
      </div>
    </div>
  );
}
