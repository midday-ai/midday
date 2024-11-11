import { ContentEditable } from "./content-editable";
import { DueDate } from "./due-date";
import { InvoiceNo } from "./invoice-no";
import { IssueDate } from "./issue-date";

type Props = {
  teamId: string;
};

export function Meta({ teamId }: Props) {
  return (
    <div>
      <ContentEditable
        className="text-[21px] font-medium mb-1 w-fit min-w-[100px]"
        name="template.title"
      />

      <div className="flex flex-col gap-0.5">
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
    </div>
  );
}
