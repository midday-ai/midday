import { DueDate } from "./due-date";
import { InvoiceNo } from "./invoice-no";
import { IssueDate } from "./issue-date";

type Props = {
  teamId: string;
};

export function Meta({ teamId }: Props) {
  return (
    <div className="grid grid-cols-3 gap-4 items-center">
      <div>
        <InvoiceNo teamId={teamId} />
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
