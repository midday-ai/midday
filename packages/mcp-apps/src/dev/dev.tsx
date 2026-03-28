import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { AppShell } from "../components/app-shell";
import { InvoiceTemplate } from "../invoice";
import "../globals.css";
import { invoiceData } from "./mock-data";

function InvoiceDevPreview() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "24px 16px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          MCP Apps — Invoice preview (dev)
        </h1>
        <button
          type="button"
          onClick={toggleTheme}
          style={{
            padding: "6px 14px",
            fontSize: 12,
            border: "1px solid var(--border-color)",
            background: "var(--card-bg)",
            color: "var(--text-primary)",
            cursor: "pointer",
          }}
        >
          {theme === "light" ? "Dark" : "Light"} mode
        </button>
      </div>
      <AppShell>
        <InvoiceTemplate data={invoiceData.data} />
      </AppShell>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <InvoiceDevPreview />
  </StrictMode>,
);
