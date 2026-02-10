import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import type { Template } from "../../../types";

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
        <span
          tw="text-[22px] text-[#878787] mr-2"
          style={{ fontFamily: "hedvig-sans" }}
        >
          {template.invoiceNoLabel}:
        </span>
        <span tw="text-[22px] text-white" style={{ fontFamily: "hedvig-sans" }}>
          {invoiceNumber}
        </span>
      </div>

      <div tw="flex items-center">
        <span
          tw="text-[22px] text-[#878787] mr-2"
          style={{ fontFamily: "hedvig-sans" }}
        >
          {template.issueDateLabel}:
        </span>
        <span tw="text-[22px] text-white" style={{ fontFamily: "hedvig-sans" }}>
          {issueDate
            ? format(new TZDate(issueDate, "UTC"), template.dateFormat)
            : ""}
        </span>
      </div>

      <div tw="flex items-center">
        <span
          tw="text-[22px] text-[#878787] mr-2"
          style={{ fontFamily: "hedvig-sans" }}
        >
          {template.dueDateLabel}:
        </span>
        <span tw="text-[22px] text-white" style={{ fontFamily: "hedvig-sans" }}>
          {dueDate
            ? format(new TZDate(dueDate, "UTC"), template.dateFormat)
            : ""}
        </span>
      </div>
    </div>
  );
}
