import type { Metadata } from "next";
import Image from "next/image";
import invoice from "public/images/update/invoice-pdf/pdf-invoice.jpg";

export const metadata: Metadata = {
  title: "React PDF Invoice Template | Midday",
  description: "A React PDF invoice template with Tiptap JSON support.",
};

export default function Page() {
  return (
    <div className="container mt-24 max-w-[540px]">
      <Image src={invoice} alt="Invoice" />
      <div className="mt-8">
        <div className="border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-xl font-medium">Use Midday Invoice Template</h3>
            <p className="text-sm text-[#878787]">
              Get started with our powerful React PDF invoice template
            </p>
          </div>
          <div className="p-6 pt-0">
            <a
              href="https://go.midday.ai/inv"
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
