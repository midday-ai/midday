"use client";

import { Icons } from "@midday/ui/icons";
import { MaterialIcon } from "./homepage/icon-mapping";

export function HeaderCommandPanelPreview() {
  const transaction = {
    name: "Acme Corporation",
  };

  const invoices = [
    {
      id: 1,
      name: "Invoice #INV-2025-001",
    },
    {
      id: 2,
      name: "Invoice #INV-2024-089",
    },
  ];

  const receipts = [
    {
      id: 1,
      name: "Receipt - Acme Services",
    },
    {
      id: 2,
      name: "Receipt - Acme Subscription",
    },
  ];

  const files = [
    {
      id: 1,
      name: "Acme_Contract_Q1_2025.pdf",
    },
    {
      id: 2,
      name: "Invoice_Acme_2025-001.pdf",
    },
  ];

  return (
    <div className="w-full h-full flex items-center justify-center p-2 bg-background">
      {/* Container with border and dotted pattern */}
      <div
        className="w-full h-full border border-border p-2 relative scale-50 origin-center"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--border)) 0.5px, transparent 0)",
          backgroundSize: "6px 6px",
        }}
      >
        {/* Command Panel Container */}
        <div className="w-full h-full border border-border bg-background flex flex-col relative">
          {/* Search Bar */}
          <div className="pt-1 pb-1 border-b border-border flex items-center">
            <div className="relative w-full">
              <input
                type="text"
                value="Acme"
                readOnly
                placeholder="Type a command or search..."
                className="w-full bg-background px-2 py-1 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none rounded-none pr-7"
              />
              <MaterialIcon
                name="search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                size={14}
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden px-2 py-2">
            {/* Transaction Section */}
            <div className="mb-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
                Transaction
              </div>
              <div className="flex items-center gap-2 pr-2 py-1">
                <MaterialIcon
                  name="list_alt"
                  className="text-muted-foreground flex-shrink-0"
                  size={16}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-foreground">
                    {transaction.name}
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Section */}
            <div className="mb-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
                Invoice
              </div>
              <div className="space-y-0.5">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center gap-2 pr-2 py-1"
                  >
                    <MaterialIcon
                      name="docs"
                      className="text-muted-foreground flex-shrink-0"
                      size={16}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-foreground">
                        {invoice.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Receipts Section */}
            <div className="mb-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
                Receipt
              </div>
              <div className="space-y-0.5">
                {receipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="flex items-center gap-2 pr-2 py-1"
                  >
                    <MaterialIcon
                      name="receipt"
                      className="text-muted-foreground flex-shrink-0"
                      size={16}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-foreground">
                        {receipt.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Files Section */}
            <div className="mb-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
                Files
              </div>
              <div className="space-y-0.5">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 pr-2 py-1"
                  >
                    <MaterialIcon
                      name="pdf"
                      className="text-muted-foreground flex-shrink-0"
                      size={16}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-foreground truncate">
                        {file.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="px-2 py-1.5 border-t border-border flex items-center justify-between">
            <div className="flex items-center">
              <Icons.LogoSmall className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors"
              >
                <MaterialIcon
                  name="arrow_upward"
                  className="text-muted-foreground"
                  size={12}
                />
              </button>
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors"
              >
                <MaterialIcon
                  name="arrow_downward"
                  className="text-muted-foreground"
                  size={12}
                />
              </button>
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors"
              >
                <MaterialIcon
                  name="subdirectory_arrow_left"
                  className="text-muted-foreground"
                  size={12}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
