import { DueDate } from "./due-date";
import { InvoiceNo } from "./invoice-no";
import { InvoiceTitle } from "./invoice-title";
import { IssueDate } from "./issue-date";

export function Meta() {
  return (
    <div className="w-full min-w-0 overflow-hidden">
      <InvoiceTitle />

      <div className="flex flex-col gap-0.5">
        <div>
          <InvoiceNo />
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
