import type { EditorDoc, Template } from "../types";
import { EditorContent } from "./components/editor-content";
import { Header } from "./components/header";
import { Logo } from "./components/logo";
import { Meta } from "./components/meta";

type Props = {
  isValidLogo: boolean;
  name: string;
  logoUrl: string;
  status: "draft" | "overdue" | "paid" | "unpaid" | "canceled";
  invoice_number: string;
  issue_date: string;
  due_date: string;
  template: Template;
  customer_details: EditorDoc;
  from_details: EditorDoc;
};

export function OgTemplate({
  invoice_number,
  issue_date,
  due_date,
  template,
  customer_details,
  from_details,
  status,
  name,
  logoUrl,
  isValidLogo,
}: Props) {
  return (
    <div tw="h-full w-full flex flex-col bg-[#0C0C0C] font-[GeistMono] p-16 py-8">
      <Header
        customerName={name}
        status={status}
        logoUrl={logoUrl}
        isValidLogo={isValidLogo}
      />

      <div tw="flex flex-col">
        <Logo src={template.logo_url} customerName={name} />
      </div>

      <Meta
        template={template}
        invoiceNumber={invoice_number}
        issueDate={issue_date}
        dueDate={due_date}
      />

      <div tw="flex justify-between mt-10">
        <div tw="flex flex-col flex-1 max-w-[50%]">
          <span tw="text-[#858585] text-[22px] font-[GeistMono] mb-1">
            {template.from_label}
          </span>
          <EditorContent content={from_details} />
        </div>

        <div tw="w-12" />

        <div tw="flex flex-col flex-1 max-w-[50%]">
          <span tw="text-[#858585] text-[22px] font-[GeistMono] mb-1">
            {template.customer_label}
          </span>
          <EditorContent content={customer_details} />
        </div>
      </div>
    </div>
  );
}
