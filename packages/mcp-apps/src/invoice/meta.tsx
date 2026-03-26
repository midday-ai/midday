import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  color: "#878787",
};

const VALUE_STYLE: React.CSSProperties = {
  fontSize: 11,
  flexShrink: 0,
};

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
    <div style={{ marginBottom: 8 }}>
      <h2
        style={{
          fontSize: 21,
          fontFamily: "var(--font-serif)",
          marginBottom: 4,
          marginTop: 0,
          minWidth: 100,
          width: "100%",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          wordBreak: "normal",
          overflowWrap: "break-word",
          hyphens: "auto",
          fontWeight: "normal",
        }}
      >
        {template.title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={LABEL_STYLE}>
            {template.invoiceNoLabel ? `${template.invoiceNoLabel}:` : ""}
          </span>
          <span style={VALUE_STYLE}>{invoiceNumber}</span>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={LABEL_STYLE}>
            {template.issueDateLabel ? `${template.issueDateLabel}:` : ""}
          </span>
          <span style={VALUE_STYLE}>
            {issueDate ? format(new TZDate(issueDate, "UTC"), dateFormat) : ""}
          </span>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={LABEL_STYLE}>
            {template.dueDateLabel ? `${template.dueDateLabel}:` : ""}
          </span>
          <span style={VALUE_STYLE}>
            {dueDate ? format(new TZDate(dueDate, "UTC"), dateFormat) : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
