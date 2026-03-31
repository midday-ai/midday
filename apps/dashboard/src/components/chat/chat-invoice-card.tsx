import { InvoiceTemplate } from "@midday/mcp-apps/invoice";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";

type ChatInvoiceCardProps = {
  data: Record<string, unknown>;
  compact?: boolean;
  onEdit: (invoiceId: string) => void;
  onViewDetails: (invoiceId: string) => void;
};

function getInvoiceMaxWidth(data: Record<string, unknown>): number {
  const template = data.template as Record<string, unknown> | undefined;
  return template?.size === "letter" ? 750 : 595;
}

export function ChatInvoiceCard({
  data,
  compact,
  onEdit,
  onViewDetails,
}: ChatInvoiceCardProps) {
  const invoiceId = data.id as string | undefined;
  const invoiceNumber = data.invoiceNumber as string | undefined;
  const status = data.status as string | undefined;
  const previewUrl = data.previewUrl as string | undefined;
  const pdfUrl = data.pdfUrl as string | undefined;
  const isDraft = status === "draft";
  const maxWidth = getInvoiceMaxWidth(data);

  if (compact) {
    return (
      <div className="mt-4 flex items-center gap-3 px-3 py-2.5 border border-border bg-muted/30">
        <Icons.Invoice className="size-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">
            {invoiceNumber ?? "Invoice"}{" "}
            <span className="text-muted-foreground font-normal">
              — Editing in canvas
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 w-full" style={{ maxWidth }}>
      <InvoiceTemplate data={data} />
      {invoiceId && (
        <div className="flex gap-2 justify-end pt-6 mt-6 border-t border-border">
          {pdfUrl && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => window.open(pdfUrl, "_blank")}
            >
              <Icons.ArrowCoolDown className="size-3" />
            </Button>
          )}
          {previewUrl && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => window.open(previewUrl, "_blank")}
            >
              <Icons.ExternalLink className="size-3" />
            </Button>
          )}
          {isDraft ? (
            <Button size="sm" onClick={() => onEdit(invoiceId)}>
              Edit Invoice
            </Button>
          ) : (
            <Button size="sm" onClick={() => onViewDetails(invoiceId)}>
              View Details
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
