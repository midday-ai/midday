import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";

type Props = {
  template: Record<string, any>;
  invoiceNumber: string | null;
  issueDate?: string | null;
  dueDate?: string | null;
};

export function Meta({ template, invoiceNumber, issueDate, dueDate }: Props) {
  if (!template) return null;

  const dateFormat = template.dateFormat || "dd/MM/yyyy";

  return (
    <div className="mb-2">
      <h2 className="text-xl font-serif mb-1 mt-0 min-w-[100px] w-full overflow-hidden [-webkit-line-clamp:2] [-webkit-box-orient:vertical] [display:-webkit-box] break-normal [overflow-wrap:break-word] [hyphens:auto] font-normal">
        {template.title}
      </h2>
      <div className="flex flex-col gap-0.5">
        <div className="flex gap-1 items-center">
          <span className="text-[11px] text-[#878787]">
            {template.invoiceNoLabel ? `${template.invoiceNoLabel}:` : ""}
          </span>
          <span className="text-[11px] shrink-0">{invoiceNumber}</span>
        </div>
        <div className="flex gap-1 items-center">
          <span className="text-[11px] text-[#878787]">
            {template.issueDateLabel ? `${template.issueDateLabel}:` : ""}
          </span>
          <span className="text-[11px] shrink-0">
            {issueDate ? format(new TZDate(issueDate, "UTC"), dateFormat) : ""}
          </span>
        </div>
        <div className="flex gap-1 items-center">
          <span className="text-[11px] text-[#878787]">
            {template.dueDateLabel ? `${template.dueDateLabel}:` : ""}
          </span>
          <span className="text-[11px] shrink-0">
            {dueDate ? format(new TZDate(dueDate, "UTC"), dateFormat) : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
