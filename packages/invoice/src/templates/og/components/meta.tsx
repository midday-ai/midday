import { format } from "date-fns";
import type { Template } from "../../types";

type Props = {
  template: Template;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
};

export function Meta({ template, invoiceNumber, issueDate, dueDate }: Props) {
  return (
    <div tw="flex justify-between items-center mt-14 mb-4">
      <div tw="flex items-center space-x-2">
        <span tw="truncate text-[22px] text-[#878787] font-[GeistMono] mr-2">
          {template.invoice_no_label}:
        </span>
        <span tw="text-[22px] text-white font-[GeistMono]">
          {invoiceNumber}
        </span>
      </div>

      <div tw="flex items-center space-x-2">
        <span tw="truncate text-[22px] text-[#878787] font-[GeistMono] mr-2">
          {template.issue_date_label}:
        </span>
        <span tw="text-[22px] text-white font-[GeistMono]">
          {format(new Date(issueDate), template.date_format)}
        </span>
      </div>

      <div tw="flex items-center space-x-2">
        <span tw="truncate text-[22px] text-[#878787] font-[GeistMono] mr-2">
          {template.due_date_label}:
        </span>
        <span tw="text-[22px] text-white font-[GeistMono]">
          {format(new Date(dueDate), template.date_format)}
        </span>
      </div>
    </div>
  );
}
