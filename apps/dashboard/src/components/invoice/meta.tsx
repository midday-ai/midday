import { DueDate } from "./due-date";
import { InvoiceNo } from "./invoice-no";
import { IssueDate } from "./issue-date";

export function Meta() {
  return (
    <div className="grid grid-cols-3 gap-4 items-center">
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
  );
}
