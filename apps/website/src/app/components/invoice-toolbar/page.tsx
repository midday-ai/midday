import type { Metadata } from "next";
import Image from "next/image";
import invoiceToolbar from "../invoice-toolbar.png";

export const metadata: Metadata = {
  title: "Invoice Toolbar | Midday",
  description: "A Next.js Invoice Toolbar for invoices.",
};

export default function Page() {
  return (
    <div className="container mt-24 max-w-[540px]">
      <div className="py-[200px] flex items-center justify-center">
        <Image
          src={invoiceToolbar}
          alt="Invoice Toolbar"
          className="max-w-[240px]"
        />
      </div>
      <div className="mt-8">
        <div className="border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-xl font-medium">Invoice Toolbar</h3>
            <p className="text-sm text-[#878787]">
              Get started with our Invoice Toolbar
            </p>
          </div>
          <div className="p-6 pt-0">
            <a
              href="https://go.midday.ai/83E5GCe"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              View implementation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
