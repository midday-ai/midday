import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import type { Template } from "../../types";

type Props = {
  template: Template;
  invoiceNumber?: string | null;
  issueDate?: string | null;
  dueDate?: string | null;
};

export function Meta({ template, invoiceNumber, issueDate, dueDate }: Props) {
  if (!template) {
    return null;
  }

  return (
    <div tw="flex justify-between items-center mt-14 mb-2">
      <div tw="flex items-center">
        <span tw="text-[22px] text-[#878787] font-mono mr-2">
          {template.invoiceNoLabel}:
        </span>
        <span tw="text-[22px] text-white font-mono">{invoiceNumber}</span>
      </div>

      <div tw="flex items-center">
        <span tw="text-[22px] text-[#878787] font-mono mr-2">
          {template.issueDateLabel}:
        </span>
        <span tw="text-[22px] text-white font-mono">
          {issueDate
            ? format(
                new TZDate(issueDate, template.timezone),
                template.dateFormat,
              )
            : ""}
        </span>
      </div>

      <div tw="flex items-center">
        <span tw="text-[22px] text-[#878787] font-mono mr-2">
          {template.dueDateLabel}:
        </span>
        <span tw="text-[22px] text-white font-mono">
          {dueDate
            ? format(
                new TZDate(dueDate, template.timezone),
                template.dateFormat,
              )
            : ""}
        </span>
      </div>
    </div>
  );
}
