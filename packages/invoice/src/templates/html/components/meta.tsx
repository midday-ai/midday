import { TZDate } from "@date-fns/tz";
import { UTCDate } from "@date-fns/utc";
import { format } from "date-fns";
import type { Template } from "../../types";

type Props = {
  template: Template;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  timezone: string;
};

export function Meta({
  template,
  invoiceNumber,
  issueDate,
  dueDate,
  timezone,
}: Props) {
  return (
    <div className="mb-2">
      <h2 className="text-[21px] font-medium font-mono mb-1 w-fit min-w-[100px]">
        {template.title}
      </h2>
      <div className="flex flex-col gap-0.5">
        <div className="flex space-x-1 items-center">
          <div className="flex items-center flex-shrink-0 space-x-1">
            <span className="truncate font-mono text-[11px] text-[#878787]">
              {template.invoice_no_label}:
            </span>
            <span className="text-[11px] font-mono flex-shrink-0">
              {invoiceNumber}
            </span>
          </div>
        </div>

        <div>
          <div>
            <div className="flex space-x-1 items-center">
              <div className="flex items-center flex-shrink-0 space-x-1">
                <span className="truncate font-mono text-[11px] text-[#878787]">
                  {template.issue_date_label}:
                </span>
                <span className="text-[11px] font-mono flex-shrink-0">
                  {format(
                    new TZDate(new UTCDate(issueDate), timezone),
                    template.date_format,
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div>
            <div className="flex space-x-1 items-center">
              <div className="flex items-center flex-shrink-0 space-x-1">
                <span className="truncate font-mono text-[11px] text-[#878787]">
                  {template.due_date_label}:
                </span>
                <span className="text-[11px] font-mono flex-shrink-0">
                  {format(
                    new TZDate(new UTCDate(dueDate), timezone),
                    template.date_format,
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
