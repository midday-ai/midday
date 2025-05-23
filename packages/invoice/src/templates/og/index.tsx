import type { Invoice } from "../types";
import { EditorContent } from "./components/editor-content";
import { Header } from "./components/header";
import { Logo } from "./components/logo";
import { Meta } from "./components/meta";

type Props = {
  data: Invoice;
  isValidLogo: boolean;
};

export function OgTemplate({ data, isValidLogo }: Props) {
  const {
    customerName,
    status,
    template,
    invoiceNumber,
    issueDate,
    dueDate,
    fromDetails,
    customerDetails,
  } = data;

  return (
    <div tw="h-full w-full flex flex-col bg-[#0C0C0C] font-[GeistMono] p-16 py-8">
      <Header
        customerName={customerName || ""}
        status={status}
        logoUrl={template.logoUrl}
        isValidLogo={isValidLogo}
      />

      <div tw="flex flex-col">
        <Logo src={template.logoUrl} customerName={customerName || ""} />
      </div>

      <Meta
        template={template}
        invoiceNumber={invoiceNumber}
        issueDate={issueDate}
        dueDate={dueDate}
      />

      <div tw="flex justify-between mt-10">
        <div tw="flex flex-col flex-1 max-w-[50%]">
          <span tw="text-[#858585] text-[22px] font-[GeistMono] mb-1">
            {template.fromLabel}
          </span>
          <EditorContent content={fromDetails} />
        </div>

        <div tw="w-12" />

        <div tw="flex flex-col flex-1 max-w-[50%]">
          <span tw="text-[#858585] text-[22px] font-[GeistMono] mb-1">
            {template.customerLabel}
          </span>
          <EditorContent content={customerDetails} />
        </div>
      </div>
    </div>
  );
}
