import { LabelInput } from "./label-input";

export function InvoiceNo() {
  return (
    <div className="flex space-x-1 items-center">
      <div className="flex items-center">
        <LabelInput name="settings.invoiceNo" />
        <span className="text-[11px] text-[#878787] font-mono">:</span>
      </div>
      <span className="text-primary text-[11px] font-mono whitespace-nowrap">
        INV-01
      </span>
    </div>
  );
}
