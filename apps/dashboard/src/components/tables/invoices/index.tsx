import { createClient } from "@midday/supabase/server";
import { DataTable } from "./table";

export async function InvoicesTable() {
  const supabase = createClient();

  const { data } = await supabase
    .from("invoices")
    .select(
      "id, invoice_no, due_date, invoice_date, amount, currency, status, customer:customer_id(id, name)",
    )
    .order("due_date", { ascending: false });

  return <DataTable data={data} />;
}
