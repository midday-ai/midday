import { DueDate } from "./due-date";
import { InvoiceNo } from "./invoice-no";
import { InvoiceTitle } from "./invoice-title";
import { IssueDate } from "./issue-date";
import { SelectTemplate } from "./select-template";

export function Meta() {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <InvoiceTitle />
        <SelectTemplate />
      </div>

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
