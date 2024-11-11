import { DueDate } from "./due-date";
import { InvoiceNo } from "./invoice-no";
import { IssueDate } from "./issue-date";

type Props = {
  teamId: string;
};

export function Meta({ teamId }: Props) {
  return (
    <div className="flex flex-col gap-2 items-end">
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
